import { describe, expect, it } from "vitest";
import {
  applySesDkimTokens,
  dkimTokensMatch,
  resolveDkimTokens,
} from "@/lib/mail-domain-tokens";
import { createMailDomainSetup } from "@/lib/mail-domain";

describe("mail-domain-tokens", () => {
  it("compares token sets regardless of order", () => {
    expect(dkimTokensMatch(["a", "b"], ["b", "a"])).toBe(true);
    expect(dkimTokensMatch(["a", "b"], ["a", "c"])).toBe(false);
  });

  it("prefers live SES tokens over cached tokens", () => {
    expect(resolveDkimTokens(["live"], ["cached"])).toEqual(["live"]);
    expect(resolveDkimTokens([], ["cached"])).toEqual(["cached"]);
  });

  it("rebuilds DKIM rows when SES tokens change", () => {
    const setup = createMailDomainSetup("example.com", ["oldtoken"]);
    const next = applySesDkimTokens(setup, [
      "pkdbfmn6lnwigctbjkyxdpqrwseblg2y",
      "pinsa6dojtgisnlbivplohnpcpb3ukyq",
      "ae3qocboyw6kaftzorkp3ieinmjpkamc",
    ]);

    expect(next.dkimTokens).toHaveLength(3);
    expect(next.records.some((r) => r.host.includes("seblg2y"))).toBe(true);
    expect(next.records.some((r) => r.host.includes("oldtoken"))).toBe(false);
  });
});
