const secret = process.env.PAYSTACK_SECRET_KEY;
if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");
const response = await fetch("https://api.paystack.co/split?perPage=100", { headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
const body = await response.json();
if (!response.ok || body.status !== true) throw new Error(`Paystack split lookup failed: HTTP ${response.status}`);
const rows = (body.data ?? []).map((split) => ({ split_code: split.split_code, name: split.name, type: split.type, currency: split.currency, subaccounts: (split.subaccounts ?? []).map((item) => ({ subaccount_code: item.subaccount_code, share: item.share, percentage_charge: item.percentage_charge })) }));
console.log(JSON.stringify({ totalSplits: rows.length, splits: rows }, null, 2));
