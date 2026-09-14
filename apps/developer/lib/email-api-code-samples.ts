import {
  EMAIL_API_PUBLIC_BASE,
  type EmailApiEndpoint,
  type HttpMethod,
} from '@/lib/email-api-catalog';

export type EmailCodeSampleLanguage = 'curl' | 'node' | 'sdk' | 'python';

export interface EmailCodeSampleRecipe {
  id: string;
  label: string;
  method: HttpMethod;
  path: string;
  body?: string;
  needsIdempotency?: boolean;
}

export const SEND_EMAIL_RECIPES: EmailCodeSampleRecipe[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    method: 'POST',
    path: '/email/messages',
    needsIdempotency: true,
    body: `{
  "from": "noreply@example.com",
  "fromName": "Your App",
  "to": ["user@example.com"],
  "subject": "Welcome",
  "bodyText": "Hello from Rukny!",
  "bodyHtml": "<p>Hello from Rukny!</p>"
}`,
  },
  {
    id: 'otp',
    label: 'OTP',
    method: 'POST',
    path: '/email/messages',
    needsIdempotency: true,
    body: `{
  "from": "noreply@example.com",
  "to": ["user@example.com"],
  "subject": "Your verification code",
  "bodyText": "Your code is 483920. It expires in 10 minutes."
}`,
  },
];

function compactJson(body: string | undefined): string {
  if (!body?.trim()) return '{}';
  return JSON.stringify(JSON.parse(body));
}

function requestUrl(path: string): string {
  return `${EMAIL_API_PUBLIC_BASE}${path.replace('{id}', 'em_01hxyz')}`;
}

export function buildEmailCodeSample(
  language: EmailCodeSampleLanguage,
  input: {
    method: HttpMethod;
    path: string;
    body?: string;
    needsIdempotency?: boolean;
    apiKeyPlaceholder?: string;
  },
): string {
  const apiKey = input.apiKeyPlaceholder ?? 'rk_live_YOUR_KEY';
  const url = requestUrl(input.path);
  const hasBody = Boolean(input.body?.trim());
  const compactBody = hasBody ? compactJson(input.body) : undefined;
  const idempotency = input.needsIdempotency !== false && input.method === 'POST';

  if (language === 'curl') {
    const lines = [`curl -X ${input.method} '${url}' \\`, `  -H 'X-API-Key: ${apiKey}' \\`];
    if (idempotency) {
      lines.push(`  -H 'Idempotency-Key: welcome_user_001' \\`);
    }
    if (hasBody) {
      lines.push(`  -H 'Content-Type: application/json' \\`);
      lines.push(`  -d '${compactBody}'`);
    } else {
      lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, '');
    }
    return lines.join('\n');
  }

  if (language === 'sdk') {
    if (input.method === 'GET' && input.path.includes('/messages/')) {
      return `import { RuknyEmail } from '@rukny/email';

const email = new RuknyEmail({
  apiKey: process.env.RUKNY_API_KEY!,
});

const status = await email.messages.getStatus('em_01hxyz');
console.log(status.status);`;
    }

    return `import { RuknyEmail } from '@rukny/email';

const email = new RuknyEmail({
  apiKey: process.env.RUKNY_API_KEY!,
});

const result = await email.messages.send(
  {
    from: 'noreply@example.com',
    to: 'user@example.com',
    subject: 'Welcome',
    bodyText: 'Hello from Rukny!',
    bodyHtml: '<p>Hello from Rukny!</p>',
  },
  { idempotencyKey: 'welcome_user_001' },
);

console.log(result.id, result.status);`;
  }

  if (language === 'node') {
    const headers: Record<string, string> = { 'X-API-Key': apiKey };
    if (idempotency) headers['Idempotency-Key'] = 'welcome_user_001';
    if (hasBody) headers['Content-Type'] = 'application/json';

    return `const response = await fetch('${url}', {
  method: '${input.method}',
  headers: ${JSON.stringify(headers, null, 2)},${
      hasBody
        ? `
  body: JSON.stringify(${input.body?.trim() ?? '{}'}),`
        : ''
    }
});

const data = await response.json();
if (!response.ok) throw new Error(data.message ?? response.statusText);
console.log(data);`;
  }

  // python
  const pyHeaders = [`"X-API-Key": "${apiKey}"`];
  if (idempotency) pyHeaders.push(`"Idempotency-Key": "welcome_user_001"`);
  if (hasBody) pyHeaders.push(`"Content-Type": "application/json"`);

  return `import requests

response = requests.request(
    "${input.method}",
    "${url}",
    headers={
        ${pyHeaders.join(',\n        ')}
    },${
      hasBody
        ? `
    json=${compactBody},`
        : ''
    }
)
response.raise_for_status()
print(response.json())`;
}

export function buildEmailEndpointCodeSample(
  language: EmailCodeSampleLanguage,
  endpoint: EmailApiEndpoint,
): string {
  return buildEmailCodeSample(language, {
    method: endpoint.method,
    path: endpoint.path,
    body: endpoint.exampleBody,
    needsIdempotency: endpoint.id === 'sendMessage',
  });
}

export function buildEmailRecipeCodeSample(
  language: EmailCodeSampleLanguage,
  recipe: EmailCodeSampleRecipe,
): string {
  return buildEmailCodeSample(language, {
    method: recipe.method,
    path: recipe.path,
    body: recipe.body,
    needsIdempotency: recipe.needsIdempotency,
  });
}

export const SDK_INSTALL = 'npm install @rukny/email';

export const SDK_QUICKSTART = `import { RuknyEmail } from '@rukny/email';

const email = new RuknyEmail({
  apiKey: process.env.RUKNY_API_KEY!,
});

const result = await email.messages.send(
  {
    from: 'noreply@yourdomain.com',
    to: 'user@example.com',
    subject: 'Welcome',
    bodyText: 'Hello from Rukny!',
  },
  { idempotencyKey: 'welcome_user_001' },
);

console.log(result.id);`;
