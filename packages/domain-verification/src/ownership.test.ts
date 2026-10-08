import { describe, expect, it } from "vitest";
import {
  buildOwnershipTxtValue,
  generateOwnershipToken,
  ownershipTxtMatches,
} from "./ownership";

describe("ownership", () => {
  it("generates a 64-char hex token", () => {
    const token = generateOwnershipToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(generateOwnershipToken()).not.toBe(token);
  });

  it("builds the ownership TXT value", () => {
    expect(buildOwnershipTxtValue("abc123")).toBe(
      "rukny-domain-verification=abc123",
    );
  });

  it("matches exact and embedded ownership TXT", () => {
    const token = "deadbeef";
    const value = buildOwnershipTxtValue(token);
    expect(ownershipTxtMatches(value, token)).toBe(true);
    expect(ownershipTxtMatches(`  ${value}  `, token)).toBe(true);
    expect(ownershipTxtMatches("rukny-domain-verification=other", token)).toBe(
      false,
    );
  });
});
