import { Prisma } from '@prisma/client';
import { SecureIds } from '../../../core/common/utils/secure-id.util';
import { mapFormFieldData } from './form-field.mapper';

/**
 * Duplicate form_steps and fields with new IDs and step mapping.
 */
export async function duplicateFormStructure(
  tx: Prisma.TransactionClient,
  originalFormId: string,
  newFormId: string,
) {
  const steps = await tx.form_steps.findMany({
    where: { formId: originalFormId },
    orderBy: { order: 'asc' },
    include: { form_fields: { orderBy: { order: 'asc' } } },
  });

  const stepIdMap = new Map<string, string>();

  for (const step of steps) {
    const newStepId = SecureIds.generic();
    stepIdMap.set(step.id, newStepId);
    await tx.form_steps.create({
      data: {
        id: newStepId,
        formId: newFormId,
        title: step.title,
        description: step.description,
        order: step.order,
        updatedAt: new Date(),
      },
    });

    if (step.form_fields.length) {
      await tx.formField.createMany({
        data: step.form_fields.map((field) => {
          const {
            id: _id,
            formId: _fid,
            stepId: _sid,
            createdAt: _c,
            updatedAt: _u,
            form_steps: _fs,
            form: _f,
            ...fieldRest
          } = field as any;
          return mapFormFieldData(fieldRest, newFormId, newStepId);
        }),
      });
    }
  }

  const rootFields = await tx.formField.findMany({
    where: { formId: originalFormId, stepId: null },
    orderBy: { order: 'asc' },
  });

  if (rootFields.length) {
    await tx.formField.createMany({
      data: rootFields.map((field) => {
        const {
          id: _id,
          formId: _fid,
          stepId: _sid,
          createdAt: _c,
          updatedAt: _u,
          form_steps: _fs,
          form: _f,
          ...fieldRest
        } = field as any;
        return mapFormFieldData(fieldRest, newFormId, null);
      }),
    });
  }
}
