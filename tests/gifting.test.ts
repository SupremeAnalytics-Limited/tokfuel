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
    expect(services).toContain("Gift now");
  });
});
