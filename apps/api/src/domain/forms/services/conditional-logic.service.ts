import { Injectable } from '@nestjs/common';
import { ConditionalLogic } from '../dto/conditional-logic.dto';
import {
  evaluateConditionalLogic,
  resolveFieldVisibility,
} from '../utils/conditional-logic-eval.util';

@Injectable()
export class ConditionalLogicService {
  evaluateCondition(
    conditionalLogic: ConditionalLogic,
    formResponses: Record<string, unknown>,
  ): boolean {
    return evaluateConditionalLogic(conditionalLogic, formResponses);
  }

  getVisibleFields(
    fields: Array<{ id: string; conditionalLogic?: unknown; required: boolean }>,
    formResponses: Record<string, unknown>,
  ): {
    visibleFieldIds: string[];
    requiredFieldIds: string[];
    skippedFieldIds: string[];
  } {
    const { visibleFieldIds, requiredFieldIds, hiddenFieldIds } =
      resolveFieldVisibility(fields, formResponses);

    return {
      visibleFieldIds,
      requiredFieldIds,
      skippedFieldIds: hiddenFieldIds,
    };
  }
}
