import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("TokFuel gifting product contract", () => {
  const appRoot = path.resolve(__dirname, "..");

  it("uses TikTok dark theme tokens", () => {
    const theme = fs.readFileSync(path.join(appRoot, "theme.config.js"), "utf8");
    expect(theme).toContain("#0B0B0F");
    expect(theme).toContain("#25F4EE");
    expect(theme).toContain("#FE2C55");
  });

  it("frames the primary experience as gifting rather than buying growth", () => {
    const home = fs.readFileSync(path.join(appRoot, "app/(tabs)/index.tsx"), "utf8");
    const services = fs.readFileSync(path.join(appRoot, "app/(tabs)/services.tsx"), "utf8");
    expect(home).toContain("creator gift");
    expect(home).toContain("Who are you gifting?");
    expect(services).toContain("Pick a way to show love");
    expect(services).toContain("Choose gift");
  });

  it("does not route checkout to the wallet dead-end and keeps the wallet refund-only", () => {
    const checkout = fs.readFileSync(path.join(appRoot, "app/(tabs)/gift-checkout.tsx"), "utf8");
    const wallet = fs.readFileSync(path.join(appRoot, "app/(tabs)/orders.tsx"), "utf8");
    expect(checkout).toContain("Pay securely with Paystack");
    expect(checkout).toContain("payments.initialize");
    expect(checkout).not.toContain('onPress={() => router.push("/(tabs)/orders")}');
    expect(wallet).toContain("Refund balance");
    expect(wallet).toContain("no add-money or deposit feature");
  });

  it("uses haptic controls for gift cards and category-specific routing", () => {
    const home = fs.readFileSync(path.join(appRoot, "app/(tabs)/index.tsx"), "utf8");
    const services = fs.readFileSync(path.join(appRoot, "app/(tabs)/services.tsx"), "utf8");
    expect(home).toContain("HapticPressable");
    expect(home).toContain('params: { category: service.category }');
    expect(services).toContain("useLocalSearchParams");
    expect(services).toContain("gift.category === category");
  });

  it("provides separate account creation and login actions", () => {
    const onboarding = fs.readFileSync(path.join(appRoot, "app/onboarding.tsx"), "utf8");
    const oauth = fs.readFileSync(path.join(appRoot, "constants/oauth.ts"), "utf8");
    expect(onboarding).toContain("Create account");
    expect(onboarding).toContain("Log in");
    expect(onboarding).toContain("startOAuthCreateAccount");
    expect(onboarding).toContain("isAuthenticated");
    expect(oauth).toContain("VITE_OAUTH_PORTAL_URL");
    expect(oauth).toContain("VITE_APP_ID");
    expect(oauth).toContain('getOAuthUrl("signUp")');
    expect(oauth).toContain('`${env.deepLinkScheme}://oauth/callback`');
  });

  it("keeps the root stack declarative to avoid update-depth loops", () => {
    const layout = fs.readFileSync(path.join(appRoot, "app/_layout.tsx"), "utf8");
    expect(layout).toContain('initialRouteName="onboarding"');
    expect(layout).not.toContain('router.replace("/onboarding")');
  });
});
