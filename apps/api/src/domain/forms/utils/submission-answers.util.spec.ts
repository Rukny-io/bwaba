import { buildSubmissionAnswersByLabel } from './submission-answers.util';

describe('buildSubmissionAnswersByLabel', () => {
  const fields = [
    { id: 'fld_1', label: 'ما الخيار الأنسب؟', type: 'RADIO' },
    { id: 'fld_2', label: 'اهتماماتك', type: 'MULTISELECT' },
    { id: 'fld_3', label: 'عنوان', type: 'HEADING' },
  ];

  it('maps field ids to question labels', () => {
    expect(
      buildSubmissionAnswersByLabel(fields, {
        fld_1: 'الخيار ب',
        fld_2: ['منتجات', 'خدمات'],
      }),
    ).toEqual({
      'ما الخيار الأنسب؟': 'الخيار ب',
      اهتماماتك: 'منتجات, خدمات',
    });
  });

  it('skips decorative fields', () => {
    expect(
      buildSubmissionAnswersByLabel(fields, {
        fld_3: 'ignored',
      }),
    ).toEqual({});
  });
});
