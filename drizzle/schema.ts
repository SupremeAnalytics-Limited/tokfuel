import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const paymentTransactions = mysqlTable("payment_transactions", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 100 }).notNull().unique(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  giftId: varchar("giftId", { length: 64 }).notNull(),
  link: text("link").notNull(),
  quantity: int("quantity").notNull(),
  customerAmount: decimal("customerAmount", { precision: 14, scale: 2 }).notNull(),
  wholesaleAmount: decimal("wholesaleAmount", { precision: 14, scale: 2 }),
  tokfuelAmount: decimal("tokfuelAmount", { precision: 14, scale: 2 }),
  paystackStatus: varchar("paystackStatus", { length: 32 }).default("initialized").notNull(),
  orderStatus: varchar("orderStatus", { length: 32 }).default("awaiting_payment").notNull(),
  refundStatus: varchar("refundStatus", { length: 32 }).default("not_applicable").notNull(),
  sociallyOrderId: varchar("sociallyOrderId", { length: 100 }),
  transferReference: varchar("transferReference", { length: 100 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const walletLedger = mysqlTable("wallet_ledger", {
  id: int("id").autoincrement().primaryKey(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 150 }).notNull().unique(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  direction: mysqlEnum("direction", ["credit", "debit"]).notNull(),
  reason: varchar("reason", { length: 64 }).notNull(),
  paymentReference: varchar("paymentReference", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type WalletLedgerEntry = typeof walletLedger.$inferSelect;
