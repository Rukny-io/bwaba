import {
  evaluateConditionalLogic,
  resolveFieldVisibility,
} from './conditional-logic-eval.util';
import {
  ConditionalAction,
  ConditionalOperator,
} from '../dto/conditional-logic.dto';

describe('conditional-logic-eval.util', () => {
  it('evaluates equals rule', () => {
    expect(
      evaluateConditionalLogic(
        {
          logic: 'AND',
          rules: [
            {
              fieldId: 'a',
              operator: ConditionalOperator.EQUALS,
              value: 'yes',
              action: ConditionalAction.SHOW,
            },
          ],
        },
        { a: 'yes' },
      ),
    ).toBe(true);
  });

  it('hides field when show condition fails', () => {
    const result = resolveFieldVisibility(
      [
        { id: 'source', required: false, conditionalLogic: null },
        {
          id: 'target',
          required: true,
          conditionalLogic: {
            logic: 'AND',
            rules: [
              {
                fieldId: 'source',
                operator: ConditionalOperator.EQUALS,
                value: 'go',
                action: ConditionalAction.SHOW,
              },
            ],
          },
        },
      ],
      { source: 'stop' },
    );

    expect(result.visibleFieldIds).toEqual(['source']);
    expect(result.hiddenFieldIds).toContain('target');
  });

  it('shows field when show condition passes', () => {
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
                operator: ConditionalOperator.EQUALS,
                value: 'go',
                action: ConditionalAction.SHOW,
              },
            ],
          },
        },
      ],
      { source: 'go' },
    );

    expect(result.visibleFieldIds).toContain('target');
    expect(result.requiredFieldIds).toContain('target');
  });
});
