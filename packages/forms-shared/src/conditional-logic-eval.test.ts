import { describe, expect, it } from 'vitest';
import {
  evaluateConditionalLogic,
  resolveFieldVisibility,
} from './conditional-logic-eval';

describe('conditional-logic-eval (shared)', () => {
  it('evaluates OR logic', () => {
    expect(
      evaluateConditionalLogic(
        {
          logic: 'OR',
          rules: [
            { fieldId: 'a', operator: 'equals', value: 'x', action: 'show' },
            { fieldId: 'b', operator: 'equals', value: 'y', action: 'show' },
          ],
        },
        { a: 'nope', b: 'y' },
      ),
    ).toBe(true);
  });

  it('hides field when show condition fails', () => {
    const result = resolveFieldVisibility(
      [
        {
          id: 'target',
          required: true,
          conditionalLogic: {
            logic: 'AND',
            rules: [
              {
                fieldId: 'source',
                operator: 'equals',
                value: 'go',
                action: 'show',
              },
            ],
          },
        },
      ],
      { source: 'stop' },
    );

    expect(result.hiddenFieldIds).toContain('target');
    expect(result.visibleFieldIds).not.toContain('target');
  });

  it('hides field when hide condition matches', () => {
    const result = resolveFieldVisibility(
      [
        {
          id: 'target',
          required: false,
          conditionalLogic: {
            logic: 'AND',
            rules: [
              {
                fieldId: 'source',
                operator: 'equals',
                value: 'hide-me',
                action: 'hide',
              },
            ],
          },
        },
      ],
      { source: 'hide-me' },
    );

    expect(result.hiddenFieldIds).toContain('target');
  });

  it('requires field only when require condition matches', () => {
    const result = resolveFieldVisibility(
      [
        {
          id: 'target',
          required: false,
          conditionalLogic: {
            logic: 'AND',
            rules: [
              {
                fieldId: 'source',
                operator: 'isNotEmpty',
                action: 'require',
              },
            ],
          },
        },
      ],
      { source: 'filled' },
    );

    expect(result.visibleFieldIds).toContain('target');
    expect(result.requiredFieldIds).toContain('target');
  });

  it('evaluates AND logic — all rules must pass', () => {
    expect(
      evaluateConditionalLogic(
        {
          logic: 'AND',
          rules: [
            { fieldId: 'a', operator: 'equals', value: '1', action: 'show' },
            { fieldId: 'b', operator: 'equals', value: '2', action: 'show' },
          ],
        },
        { a: '1', b: 'wrong' },
      ),
    ).toBe(false);
  });
});
