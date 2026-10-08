import { describe, expect, it } from "vitest";
import { generateOwnershipToken } from "./ownership";
import { verifyDomainDns } from "./verify-dns";

describe("verifyDomainDns", () => {
  it("rejects missing ownership token", async () => {
    const result = await verifyDomainDns("example.com", {
      getSesStatus: async () => ({
        found: true,
        sending: true,
        dkim: "SUCCESS",
        tokens: ["a", "b", "c"],
      }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.verified).toBe(false);
    expect(result.ownershipMissing).toBe(true);
  });

  it("requires ownership TXT in records when token is provided", async () => {
    const token = generateOwnershipToken();
    const result = await verifyDomainDns("example.com", {
      ownershipToken: token,
      dkimTokens: ["tok1", "tok2", "tok3"],
      getSesStatus: async () => ({
        found: true,
        sending: false,
        dkim: "PENDING",
        tokens: ["tok1", "tok2", "tok3"],
      }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.records.some((record) => record.id === "rukny-ownership")).toBe(
      true,
    );
    expect(result.verified).toBe(false);
  });

  it("returns validation error for invalid domain", async () => {
    const result = await verifyDomainDns("", {
      ownershipToken: generateOwnershipToken(),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeTruthy();
  });
});
