import { describe, expect, it } from "vitest";
import { generateOwnershipToken } from "@rukny/domain-verification";
import { verifyDomainDns } from "./verify-dns";

describe("domain reclaim security", () => {
  it("does not verify without an ownership token even if SES is ready", async () => {
    const result = await verifyDomainDns("example.com", ["tok1", "tok2", "tok3"]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.verified).toBe(false);
    expect(result.ownershipMissing).toBe(true);
  });

  it("includes ownership TXT in required records for a new claim", async () => {
    const token = generateOwnershipToken();
    const result = await verifyDomainDns(
      "example.com",
      ["tok1", "tok2", "tok3"],
      token,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.records.some(
        (record) =>
          record.purpose === "RUKNY_OWNERSHIP" &&
          record.value === `rukny-domain-verification=${token}`,
      ),
    ).toBe(true);
    expect(result.verified).toBe(false);
  });
});
