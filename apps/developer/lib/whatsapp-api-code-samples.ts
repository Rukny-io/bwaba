import {
  WHATSAPP_API_PUBLIC_BASE,
  type HttpMethod,
  type WhatsappApiEndpoint,
} from '@/lib/whatsapp-api-catalog';

export type CodeSampleLanguage = 'curl' | 'node' | 'python' | 'php';

export interface CodeSampleRecipe {
  id: string;
  labelKey: string;
  method: HttpMethod;
  path: string;
  body?: string;
}

export const SEND_MESSAGE_RECIPES: CodeSampleRecipe[] = [
  {
    id: 'text',
    labelKey: 'recipeText',
    method: 'POST',
    path: '/whatsapp/messages',
    body: `{
  "to": "+9647xxxxxxxxx",
  "type": "text",
  "text": { "body": "Hello from Rukny!" }
}`,
  },
  {
    id: 'template',
    labelKey: 'recipeTemplate',
    method: 'POST',
    path: '/whatsapp/messages',
    body: `{
  "to": "+9647xxxxxxxxx",
  "type": "template",
  "template": {
    "name": "order_confirmation",
    "language": { "code": "ar" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Ahmed" },
          { "type": "text", "text": "#12345" }
        ]
      }
    ]
  }
}`,
  },
  {
    id: 'otp',
    labelKey: 'recipeOtp',
    method: 'POST',
    path: '/whatsapp/messages',
    body: `{
  "to": "+9647xxxxxxxxx",
  "type": "template",
  "template": {
    "name": "otp_verify",
    "language": { "code": "ar" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "483920" }
        ]
      }
    ]
  }
}`,
  },
];

function compactJson(body: string | undefined): string {
  if (!body?.trim()) return '{}';
  return JSON.stringify(JSON.parse(body));
}

function requestUrl(path: string): string {
  return `${WHATSAPP_API_PUBLIC_BASE}${path
    .replace(':id', 'MSG_ID')
    .replace(':name', 'hello_world')}`;
}

export function buildCodeSample(
  language: CodeSampleLanguage,
  input: {
    method: HttpMethod;
    path: string;
    body?: string;
    apiKeyPlaceholder?: string;
  },
): string {
  const apiKey = input.apiKeyPlaceholder ?? 'rk_live_YOUR_KEY';
  const url = requestUrl(input.path);
  const hasBody = Boolean(input.body?.trim());
  const compactBody = hasBody ? compactJson(input.body) : undefined;

  if (language === 'curl') {
    if (!hasBody) {
      return [
        `curl -X ${input.method} '${url}' \\`,
        `  -H "X-API-Key: ${apiKey}"`,
      ].join('\n');
    }
    return [
      `curl -X ${input.method} '${url}' \\`,
      `  -H "X-API-Key: ${apiKey}" \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -d '${compactBody}'`,
    ].join('\n');
  }

  if (language === 'node') {
    if (input.path === '/whatsapp/messages' && input.body?.includes('"type": "text"')) {
      return `import { RuknyWhatsApp } from '@rukny/whatsapp';

const wa = new RuknyWhatsApp({ apiKey: process.env.RUKNY_API_KEY! });

await wa.messages.sendText({
  to: '+9647xxxxxxxxx',
  body: 'Hello from Rukny!',
});`;
    }
    if (input.body?.includes('otp_verify')) {
      return `import { RuknyWhatsApp } from '@rukny/whatsapp';

const wa = new RuknyWhatsApp({ apiKey: process.env.RUKNY_API_KEY! });

await wa.messages.sendOtp({
  to: '+9647xxxxxxxxx',
  code: '483920',
  template: 'otp_verify',
  language: 'ar',
});`;
    }
    if (input.body?.includes('"type": "template"')) {
      return `import { RuknyWhatsApp } from '@rukny/whatsapp';

const wa = new RuknyWhatsApp({ apiKey: process.env.RUKNY_API_KEY! });

await wa.messages.sendTemplate({
  to: '+9647xxxxxxxxx',
  name: 'order_confirmation',
  language: 'ar',
  variables: ['Ahmed', '#12345'],
});`;
    }
    return `import { RuknyWhatsApp } from '@rukny/whatsapp';

const wa = new RuknyWhatsApp({ apiKey: process.env.RUKNY_API_KEY! });

const result = await wa.messages.send(${hasBody ? JSON.parse(compactBody!) : '{}'});
console.log(result);`;
  }

  if (language === 'python') {
    const payloadLiteral = hasBody
      ? `json.loads('''${compactBody!.replace(/'/g, "\\'")}''')`
      : 'None';
    return `import json
import os
import requests

payload = ${payloadLiteral}

response = requests.${input.method.toLowerCase()}(
    "${url}",
    headers={
        "X-API-Key": os.environ["RUKNY_API_KEY"],
        "Content-Type": "application/json",
    },
    json=payload,
)
response.raise_for_status()
print(response.json())`;
  }

  const phpBody = hasBody ? compactBody : '{}';
  return `<?php
$ch = curl_init('${url}');
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => '${input.method}',
    CURLOPT_HTTPHEADER => [
        'X-API-Key: ' . getenv('RUKNY_API_KEY'),
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => '${phpBody}',
    CURLOPT_RETURNTRANSFER => true,
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`;
}

export function buildEndpointCodeSample(
  language: CodeSampleLanguage,
  endpoint: WhatsappApiEndpoint,
): string {
  return buildCodeSample(language, {
    method: endpoint.method,
    path: endpoint.path,
    body: endpoint.exampleBody,
  });
}

export function buildRecipeCodeSample(
  language: CodeSampleLanguage,
  recipe: CodeSampleRecipe,
): string {
  return buildCodeSample(language, {
    method: recipe.method,
    path: recipe.path,
    body: recipe.body,
  });
}

export const WEBHOOK_VERIFY_SAMPLES: Record<CodeSampleLanguage, string> = {
  curl: `# Webhooks are received on your server — verify X-Rukny-Signature in your handler`,
  node: `import { verifyWebhookSignature, assertWebhookDeliveryNotReplayed } from '@rukny/whatsapp';

const seen = new Set<string>();
const deliveryId = req.headers['x-rukny-delivery'];
if (!assertWebhookDeliveryNotReplayed(deliveryId, seen)) {
  return res.status(409).end();
}

const valid = verifyWebhookSignature({
  rawBody: req.rawBody,
  signatureHeader: req.headers['x-rukny-signature'],
  secret: process.env.RUKNY_WEBHOOK_SECRET!,
  timestampHeader: req.headers['x-rukny-timestamp'],
});

if (!valid) return res.status(401).end();`,
  python: `import hmac
import hashlib

def verify_signature(raw_body: bytes, signature: str, secret: str) -> bool:
    expected = 'sha256=' + hmac.new(
        secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)`,
  php: `<?php
function verifyRuknySignature(string $rawBody, ?string $signature, string $secret): bool {
    if (!$signature || !str_starts_with($signature, 'sha256=')) return false;
    $expected = 'sha256=' . hash_hmac('sha256', $rawBody, $secret);
    return hash_equals($expected, $signature);
}`,
};
