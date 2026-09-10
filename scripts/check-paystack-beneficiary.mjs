const secret = process.env.PAYSTACK_SECRET_KEY;
if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");
const response = await fetch("https://api.paystack.co/subaccount?perPage=100", {
  headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" },
  signal: AbortSignal.timeout(15000),
});
const body = await response.json();
if (!response.ok || body.status !== true) throw new Error(`Paystack subaccount lookup failed: HTTP ${response.status}`);
const matches = (body.data ?? []).filter((item) => String(item.account_number ?? "") === "6635796668");
console.log(JSON.stringify({ totalSubaccounts: body.data?.length ?? 0, matchingBeneficiaries: matches.map((item) => ({ subaccount_code: item.subaccount_code, account_number: item.account_number, business_name: item.business_name, settlement_bank: item.settlement_bank, percentage_charge: item.percentage_charge })) }, null, 2));
