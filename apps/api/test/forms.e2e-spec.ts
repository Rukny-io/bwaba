import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/database/prisma/prisma.service';
import { randomUUID } from 'crypto';
import {
  cleanupE2eUser,
  createE2eAuthContext,
  type E2eAuthContext,
} from './helpers/e2e-auth.helper';
import { seedPublishedForm } from './helpers/e2e-forms.fixture';

const hasDatabase = Boolean(process.env.DATABASE_URL);
const E2E_UA = 'Rukny-E2E/1.0';

describe('Forms (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService | null = null;

  let auth: E2eAuthContext;
  let testFormSlug: string;
  let testFieldId: string;
  let singleResponseFormSlug: string;
  let singleResponseFieldId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    if (!hasDatabase) return;

    prisma = app.get(PrismaService);
    auth = await createE2eAuthContext(prisma);

    const seeded = await seedPublishedForm(prisma, auth.userId, {
      slug: `e2e-form-${randomUUID().slice(0, 8)}`,
      title: 'E2E Test Form',
    });
    testFormSlug = seeded.slug;
    testFieldId = seeded.fieldId;

    singleResponseFormSlug = `e2e-once-${randomUUID().slice(0, 8)}`;
    singleResponseFieldId = randomUUID();
    await prisma.form.create({
      data: {
        userId: auth.userId,
        title: 'E2E Once Form',
        slug: singleResponseFormSlug,
        status: 'PUBLISHED',
        allowMultipleSubmissions: false,
        oneResponsePerUser: true,
        fields: {
          create: {
            id: singleResponseFieldId,
            label: 'Answer',
            type: 'TEXT',
            order: 0,
            required: false,
          },
        },
      },
    });
  });

  afterAll(async () => {
    if (prisma && auth?.userId) {
      await cleanupE2eUser(prisma, auth.userId);
    }
    await app.close();
  });

  function withAuth<T extends { set: (k: string, v: string) => T }>(req: T): T {
    return req.set('Cookie', auth.cookieHeader).set('User-Agent', E2E_UA);
  }

  it('GET /api/v1/forms/public/non-existent-slug returns 404', () => {
    return request(app.getHttpServer())
      .get('/api/v1/forms/public/this-slug-does-not-exist-xyz')
      .expect(404);
  });

  describe('with database', () => {
    const itDb = hasDatabase ? it : it.skip;

    itDb('GET public form returns published form with fields', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/forms/public/${testFormSlug}`)
        .expect(200);

      expect(res.body.slug).toBe(testFormSlug);
      expect(res.body.status).toBe('PUBLISHED');
      expect(res.body.fields?.length).toBeGreaterThan(0);
    });

    itDb('POST public submit creates a submission', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/forms/public/${testFormSlug}/submit`)
        .send({ data: { [testFieldId]: 'Alice' } })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.formId).toBeDefined();
    });

    itDb('full lifecycle: create → publish → submit → list → delete', async () => {
      const uniqueAnswer = `e2e-life-${randomUUID().slice(0, 8)}`;

      const created = await withAuth(request(app.getHttpServer()).post('/api/v1/forms'))
        .send({
          title: 'E2E Lifecycle Form',
          type: 'CONTACT',
          status: 'DRAFT',
          fields: [
            {
              label: 'Message',
              type: 'TEXT',
              order: 0,
              required: true,
            },
          ],
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const formId = created.body.id as string;
      expect(formId).toBeDefined();

      await withAuth(
        request(app.getHttpServer()).put(`/api/v1/forms/${formId}/status`),
      )
        .send({ status: 'PUBLISHED' })
        .expect(200);

      const detail = await withAuth(
        request(app.getHttpServer()).get(`/api/v1/forms/${formId}`),
      )
        .expect(200);

      const slug = detail.body.slug as string;
      const savedFieldId = detail.body.fields[0].id as string;

      await request(app.getHttpServer())
        .get(`/api/v1/forms/public/${slug}`)
        .expect(200);

      const submitted = await request(app.getHttpServer())
        .post(`/api/v1/forms/public/${slug}/submit`)
        .send({ data: { [savedFieldId]: uniqueAnswer } })
        .expect(201);

      const submissionId = submitted.body.id as string;

      const listed = await withAuth(
        request(app.getHttpServer()).get(`/api/v1/forms/${formId}/submissions`),
      )
        .query({ search: uniqueAnswer, limit: 10 })
        .expect(200);

      const rows = listed.body.submissions ?? listed.body.data ?? [];
      expect(
        rows.some(
          (s: { id: string; data?: Record<string, unknown> }) =>
            s.id === submissionId ||
            String(s.data?.[savedFieldId] ?? '').includes(uniqueAnswer),
        ),
      ).toBe(true);

      await withAuth(
        request(app.getHttpServer()).delete(
          `/api/v1/forms/${formId}/submissions/${submissionId}`,
        ),
      )
        .expect(204);
    });

    itDb('Idempotency-Key returns the same submission on retry', async () => {
      const key = `e2e-idem-${randomUUID().slice(0, 12)}`;

      const first = await request(app.getHttpServer())
        .post(`/api/v1/forms/public/${testFormSlug}/submit`)
        .set('Idempotency-Key', key)
        .send({ data: { [testFieldId]: 'Bob' } })
        .expect(201);

      const second = await request(app.getHttpServer())
        .post(`/api/v1/forms/public/${testFormSlug}/submit`)
        .set('Idempotency-Key', key)
        .send({ data: { [testFieldId]: 'Bob again' } })
        .expect(201);

      expect(second.body.id).toBe(first.body.id);
    });

    itDb('deprecated disk upload returns 410 Gone', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/forms/public/${testFormSlug}/upload`)
        .expect(410);
    });

    itDb('public upload session returns a session token', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/forms/public/${testFormSlug}/upload/session`)
        .expect(201);

      expect(res.body.sessionToken).toBeDefined();
      expect(res.body.expiresAt).toBeDefined();
    });

    itDb('authenticated user cannot submit twice when oneResponsePerUser', async () => {
      const form = await prisma!.form.findUnique({
        where: { slug: singleResponseFormSlug },
      });
      expect(form).toBeTruthy();

      await withAuth(
        request(app.getHttpServer()).post(`/api/v1/forms/${form!.id}/submit`),
      )
        .send({ data: { [singleResponseFieldId]: 'first' } })
        .expect(201);

      await withAuth(
        request(app.getHttpServer()).post(`/api/v1/forms/${form!.id}/submit`),
      )
        .send({ data: { [singleResponseFieldId]: 'second' } })
        .expect(409);
    });
  });
});
