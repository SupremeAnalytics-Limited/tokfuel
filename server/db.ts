import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, paymentTransactions, users, walletLedger } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPaymentTransaction(input: typeof paymentTransactions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(paymentTransactions).values(input);
  const rows = await db.select().from(paymentTransactions).where(eq(paymentTransactions.reference, input.reference)).limit(1);
  return rows[0];
}

export async function getPaymentTransaction(reference: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(paymentTransactions).where(eq(paymentTransactions.reference, reference)).limit(1);
  return rows[0];
}

export async function updatePaymentTransaction(reference: string, values: Partial<typeof paymentTransactions.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(paymentTransactions).set(values).where(eq(paymentTransactions.reference, reference));
  return getPaymentTransaction(reference);
}

export async function getWalletBalance(customerEmail: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ balance: sql<string>`COALESCE(SUM(CASE WHEN ${walletLedger.direction} = 'credit' THEN ${walletLedger.amount} ELSE -${walletLedger.amount} END), 0)` }).from(walletLedger).where(eq(walletLedger.customerEmail, customerEmail));
  return Number(rows[0]?.balance ?? 0);
}

export async function appendWalletEntry(input: typeof walletLedger.$inferInsert): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  try {
    await db.insert(walletLedger).values(input);
    return true;
  } catch (error) {
    // The unique idempotency key means retries do not create another credit/debit.
    if (String(error).toLowerCase().includes("duplicate")) return false;
    throw error;
  }
}

export async function debitWallet(input: { customerEmail: string; amount: number; idempotencyKey: string; reason: string; paymentReference: string }) {
  const balance = await getWalletBalance(input.customerEmail);
  if (balance < input.amount) return { debited: false, balance };
  const debited = await appendWalletEntry({ customerEmail: input.customerEmail, amount: input.amount.toFixed(2), direction: "debit", idempotencyKey: input.idempotencyKey, reason: input.reason, paymentReference: input.paymentReference });
  return { debited, balance: await getWalletBalance(input.customerEmail) };
}
