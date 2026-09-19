/**
 * Documents the RLS foundation migration intent for reviewers / ops.
 * Tenant-scoped policies require request GUC middleware — not enabled yet.
 */
describe('RLS foundation migration', () => {
  it('ships FORCE RLS + permissive policies for high-value tables', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path') as typeof import('path');
    const sqlPath = path.join(
      __dirname,
      '../../../prisma/migrations/20260919123000_rls_foundation_high_value_tables/migration.sql',
    );
    const sql = fs.readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('FORCE ROW LEVEL SECURITY');
    expect(sql).toContain('sessions');
    expect(sql).toContain('developer_api_keys');
    expect(sql).toContain('developer_whatsapp_accounts');
    expect(sql).toContain('identity_verifications');
    expect(sql).toContain('form_integrations');
    expect(sql).toContain('USING (true)');
  });
});
