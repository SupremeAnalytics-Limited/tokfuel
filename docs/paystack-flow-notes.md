# Paystack flow notes

Paystack split-payment documentation: https://paystack.com/docs/payments/split-payments/

Relevant verified behavior: transaction initialization supports `subaccount` for a subaccount split. Passing `transaction_charge` overrides the default percentage behavior so the main account can receive a flat fee. Transfers are a separate API path and require a transfer recipient. Paystack webhooks are documented at https://paystack.com/docs/payments/webhooks/; webhook requests must be signature-checked with the Paystack secret and processed idempotently.

Current cloud verification on 2026-09-10 found the supplied beneficiary account 6635796668 (PalmPay; Riteweb Digital Services-Sim(Paymentpoint)) represented by Paystack subaccount code `ACCT_igpuusc0665sos7`. The existing split list contains one percentage split named `Test ` with a 71.43 share but does not expose a matching beneficiary in its returned subaccount list. The implementation therefore uses server-only transfer logic after payment verification and exact upstream charge calculation, rather than silently relying on the existing percentage split.
