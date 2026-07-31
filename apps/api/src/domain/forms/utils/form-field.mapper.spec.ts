import {
  mapFormFieldData,
  resolveFormFieldId,
} from './form-field.mapper';

describe('resolveFormFieldId', () => {
  it('generates a new id when preserveId is off', () => {
    const id = resolveFormFieldId({ id: 'fld_existing' });
    expect(id).toMatch(/^fld_/);
    expect(id).not.toBe('fld_existing');
  });

  it('preserves a valid server field id', () => {
    expect(
      resolveFormFieldId({ id: 'fld_V1StGXR8_Z5jdHi6B-myT' }, { preserveId: true }),
    ).toBe('fld_V1StGXR8_Z5jdHi6B-myT');
  });

  it('preserves a client uuid', () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    expect(resolveFormFieldId({ id: uuid }, { preserveId: true })).toBe(uuid);
  });

  it('trims whitespace before preserving', () => {
    expect(
      resolveFormFieldId({ id: '  fld_abc  ' }, { preserveId: true }),
    ).toBe('fld_abc');
  });

  it('rejects empty or unsafe ids', () => {
    expect(resolveFormFieldId({ id: '   ' }, { preserveId: true })).toMatch(
      /^fld_/,
    );
    expect(
      resolveFormFieldId({ id: 'bad id with spaces' }, { preserveId: true }),
    ).toMatch(/^fld_/);
  });
});

describe('mapFormFieldData', () => {
  it('maps payload with preserved id', () => {
    const row = mapFormFieldData(
      {
        id: 'fld_keep_me',
        label: 'Email',
        type: 'EMAIL',
        order: 0,
      },
      'frm_form1',
      null,
      { preserveId: true },
    );

    expect(row.id).toBe('fld_keep_me');
    expect(row.formId).toBe('frm_form1');
    expect(row.label).toBe('Email');
    expect(row.type).toBe('EMAIL');
    expect(row.order).toBe(0);
  });
});
