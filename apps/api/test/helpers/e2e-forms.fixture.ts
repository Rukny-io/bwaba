import { randomBytes, randomUUID } from 'crypto';
import type { PrismaClient } from '@prisma/client';

type E2ePrisma = Pick<
  PrismaClient,
  'form' | 'formField' | '$executeRaw'
>;

export interface E2ePublishedFormFixture {
  formId: string;
  slug: string;
  fieldId: string;
  title: string;
}

/** Public app accepts only /^[a-z0-9]{6}$/ — see apps/public/app/f/[slug]/page.tsx */
export function generateE2eSlug(): string {
  return randomBytes(4).toString('hex').slice(0, 6);
}

function isSchemaDriftError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  return code === 'P2022' || code === 'P2021';
}

async function seedPublishedFormRaw(
  prisma: E2ePrisma,
  input: {
    formId: string;
    userId: string;
    slug: string;
    title: string;
    fieldId: string;
  },
): Promise<void> {
  const { formId, userId, slug, title, fieldId } = input;

  await prisma.$executeRaw`
    INSERT INTO forms (
      id, "userId", title, slug, status, type,
      "allowMultipleSubmissions", "createdAt", "updatedAt"
    )
    VALUES (
      ${formId}::uuid,
      ${userId}::uuid,
      ${title},
      ${slug},
      'PUBLISHED'::"FormStatus",
      'CONTACT'::"FormType",
      true,
      NOW(),
      NOW()
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO form_fields (
      id, "formId", label, type, "order", required, placeholder,
      "createdAt", "updatedAt"
    )
    VALUES (
      ${fieldId}::uuid,
      ${formId}::uuid,
      'الاسم',
      'TEXT'::"FieldType",
      0,
      true,
      'اكتب اسمك',
      NOW(),
      NOW()
    )
  `;
}

export async function seedPublishedForm(
  prisma: E2ePrisma,
  userId: string,
  overrides?: Partial<{ slug: string; title: string }>,
): Promise<E2ePublishedFormFixture> {
  const slug = overrides?.slug ?? generateE2eSlug();
  const fieldId = randomUUID();
  const formId = randomUUID();
  const title = overrides?.title ?? 'E2E Playwright Form';

  try {
    const form = await prisma.form.create({
      data: {
        userId,
        title,
        slug,
        status: 'PUBLISHED',
        type: 'CONTACT',
        allowMultipleSubmissions: true,
        fields: {
          create: {
            id: fieldId,
            label: 'الاسم',
            type: 'TEXT',
            order: 0,
            required: true,
            placeholder: 'اكتب اسمك',
          },
        },
      },
    });

    return { formId: form.id, slug, fieldId, title };
  } catch (error) {
    if (!isSchemaDriftError(error)) {
      throw error;
    }

    console.warn(
      '[e2e:seed] Prisma schema drift detected — using raw SQL fallback for form seed.',
    );
    await seedPublishedFormRaw(prisma, { formId, userId, slug, title, fieldId });
    return { formId, slug, fieldId, title };
  }
}
