import { describe, expect, it } from 'vitest';
import { parseConditionalLogic } from '@/lib/conditional-logic-types';

describe('parseConditionalLogic', () => {
  it('returns null for empty input', () => {
    expect(parseConditionalLogic(null)).toBeNull();
    expect(parseConditionalLogic({ rules: [] })).toBeNull();
  });

  it('normalizes valid rules', () => {
    const parsed = parseConditionalLogic({
      logic: 'OR',
      rules: [
        {
          fieldId: 'field-1',
          operator: 'equals',
          value: 'yes',
          action: 'show',
        },
      ],
    });

    expect(parsed?.logic).toBe('OR');
    expect(parsed?.rules[0]?.fieldId).toBe('field-1');
  });
});
