import {
  buildCurrentFieldKeySet,
  collectFieldResponseCounts,
  collectOrphanedFieldKeys,
  countSubmissionsWithFieldValue,
  formatOrphanedFieldKeyLabel,
  getSubmissionFieldValue,
} from './submission-field-data.util';

describe('submission-field-data.util', () => {
  const field = { id: 'fld_one', label: 'الاسم' };

  it('reads values by id then label', () => {
    expect(
      getSubmissionFieldValue({ fld_one: 'أحمد' }, field),
    ).toBe('أحمد');
    expect(
      getSubmissionFieldValue({ الاسم: 'سارة' }, field),
    ).toBe('سارة');
  });

  it('counts responses per field id', () => {
    const submissions = [
      { data: { fld_one: 'أ' } },
      { data: { fld_one: '' } },
      { data: { other: 'x' } },
    ];
    expect(countSubmissionsWithFieldValue(submissions, field)).toBe(1);
    expect(collectFieldResponseCounts(submissions, [field])).toEqual({
      fld_one: 1,
    });
  });

  it('finds orphaned keys not linked to current fields', () => {
    const current = buildCurrentFieldKeySet([field]);
    const submissions = [
      { data: { fld_one: 'أ', fld_old: 'قديم' } },
      { data: { fld_old: 'آخر' } },
    ];
    expect(collectOrphanedFieldKeys(submissions, current)).toEqual(['fld_old']);
  });

  it('formats orphaned labels', () => {
    expect(formatOrphanedFieldKeyLabel('fld_abc12345')).toContain('حقل محذوف');
  });
});
