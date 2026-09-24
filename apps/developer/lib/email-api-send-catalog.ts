import { EMAIL_API_PUBLIC_BASE } from '@/lib/email-api-catalog';
import { SDK_INSTALL, SDK_QUICKSTART } from '@/lib/email-api-code-samples';

const SEND_URL = `${EMAIL_API_PUBLIC_BASE}/email/messages`;
const API_KEY = 'rk_live_YOUR_KEY';
const SMTP_HOST = process.env.NEXT_PUBLIC_DEVELOPER_SMTP_HOST || 'smtp.rukny.io';
const SMTP_USER = process.env.NEXT_PUBLIC_DEVELOPER_SMTP_USERNAME || 'rukny';

export type SendExampleId =
  | 'node'
  | 'serverless'
  | 'php'
  | 'ruby'
  | 'python'
  | 'go'
  | 'rust'
  | 'elixir'
  | 'java'
  | 'dotnet'
  | 'smtp'
  | 'cli';

export type SendExampleSection = {
  id: string;
  title: string;
  description?: string;
  code: string;
  language?: string;
};

export type SendExample = {
  id: SendExampleId;
  label: string;
  description: string;
  prerequisites: string[];
  sections: SendExampleSection[];
};

const REST_BODY = `{
  "from": "noreply@yourdomain.com",
  "fromName": "Your App",
  "to": ["user@example.com"],
  "subject": "Hello World",
  "bodyText": "It works!",
  "bodyHtml": "<p>It works!</p>"
}`;

export const SEND_EXAMPLES: SendExample[] = [
  {
    id: 'node',
    label: 'Node.js',
    description:
      'Send email from Node.js or TypeScript using the official @rukny/email SDK (recommended) or fetch.',
    prerequisites: [
      'A Rukny developer app with Email API installed',
      'A verified domain and authorized sender',
      'An API key with email:send scope',
    ],
    sections: [
      {
        id: 'install',
        title: 'Install',
        code: SDK_INSTALL,
        language: 'bash',
      },
      {
        id: 'send',
        title: 'Send an email',
        description: 'Server-side only — never expose API keys in the browser.',
        code: SDK_QUICKSTART,
        language: 'typescript',
      },
      {
        id: 'fetch',
        title: 'Alternative: fetch',
        code: `const response = await fetch('${SEND_URL}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.RUKNY_API_KEY!,
    'Idempotency-Key': 'welcome_user_001',
  },
  body: JSON.stringify({
    from: 'noreply@yourdomain.com',
    to: ['user@example.com'],
    subject: 'Hello World',
    bodyText: 'It works!',
  }),
});

const data = await response.json();
if (!response.ok) throw new Error(data.message ?? response.statusText);`,
        language: 'typescript',
      },
    ],
  },
  {
    id: 'serverless',
    label: 'Serverless',
    description:
      'Call the REST API from Vercel Functions, AWS Lambda, Cloudflare Workers, or any short-lived runtime.',
    prerequisites: [
      'Store RUKNY_API_KEY in your platform secrets (never commit it)',
      'Authorized sender on a verified domain',
    ],
    sections: [
      {
        id: 'vercel',
        title: 'Vercel Function',
        code: `export default async function handler(req, res) {
  const response = await fetch('${SEND_URL}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.RUKNY_API_KEY,
      'Idempotency-Key': 'otp_' + Date.now(),
    },
    body: JSON.stringify({
      from: 'noreply@yourdomain.com',
      to: ['user@example.com'],
      subject: 'Your code',
      bodyText: 'Your verification code is 483920.',
    }),
  });

  const data = await response.json();
  res.status(response.status).json(data);
}`,
        language: 'javascript',
      },
      {
        id: 'lambda',
        title: 'AWS Lambda',
        code: `export const handler = async () => {
  const response = await fetch('${SEND_URL}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.RUKNY_API_KEY!,
      'Idempotency-Key': 'lambda_send_001',
    },
    body: JSON.stringify({
      from: 'noreply@yourdomain.com',
      to: ['user@example.com'],
      subject: 'Hello from Lambda',
      bodyText: 'It works!',
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return { statusCode: 200, body: await response.text() };
};`,
        language: 'typescript',
      },
      {
        id: 'workers',
        title: 'Cloudflare Workers',
        code: `export default {
  async fetch(request, env) {
    const response = await fetch('${SEND_URL}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': env.RUKNY_API_KEY,
        'Idempotency-Key': 'worker_send_001',
      },
      body: JSON.stringify({
        from: 'noreply@yourdomain.com',
        to: ['user@example.com'],
        subject: 'Hello from Workers',
        bodyText: 'It works!',
      }),
    });

    return new Response(await response.text(), { status: response.status });
  },
};`,
        language: 'javascript',
      },
    ],
  },
  {
    id: 'php',
    label: 'PHP',
    description: 'Send with Guzzle, cURL, or Laravel mail over SMTP.',
    prerequisites: [
      'PHP 8.1+ with curl or Guzzle',
      'API key with email:send, or SMTP credentials',
    ],
    sections: [
      {
        id: 'curl',
        title: 'cURL',
        code: `<?php
$ch = curl_init('${SEND_URL}');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-API-Key: ' . getenv('RUKNY_API_KEY'),
        'Idempotency-Key: welcome_user_001',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'from' => 'noreply@yourdomain.com',
        'to' => ['user@example.com'],
        'subject' => 'Hello World',
        'bodyText' => 'It works!',
    ]),
]);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($status >= 400) {
    throw new RuntimeException($response);
}

echo $response;`,
        language: 'php',
      },
      {
        id: 'guzzle',
        title: 'Guzzle',
        code: `<?php
use GuzzleHttp\\Client;

$client = new Client();
$response = $client->post('${SEND_URL}', [
    'headers' => [
        'X-API-Key' => getenv('RUKNY_API_KEY'),
        'Idempotency-Key' => 'welcome_user_001',
    ],
    'json' => [
        'from' => 'noreply@yourdomain.com',
        'to' => ['user@example.com'],
        'subject' => 'Hello World',
        'bodyText' => 'It works!',
    ],
]);

echo $response->getBody();`,
        language: 'php',
      },
      {
        id: 'laravel-smtp',
        title: 'Laravel (SMTP)',
        description: 'Use Rukny SMTP when you prefer MAIL_MAILER=smtp.',
        code: `MAIL_MAILER=smtp
MAIL_HOST=${SMTP_HOST}
MAIL_PORT=587
MAIL_USERNAME=${SMTP_USER}
MAIL_PASSWORD=rk_live_your_api_key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com`,
        language: 'ini',
      },
    ],
  },
  {
    id: 'ruby',
    label: 'Ruby',
    description: 'Send with Net::HTTP or Faraday from Rails, Sinatra, or plain Ruby.',
    prerequisites: ['Ruby 3.x', 'API key with email:send'],
    sections: [
      {
        id: 'net-http',
        title: 'Net::HTTP',
        code: `require 'net/http'
require 'json'
require 'uri'

uri = URI('${SEND_URL}')
request = Net::HTTP::Post.new(uri)
request['Content-Type'] = 'application/json'
request['X-API-Key'] = ENV.fetch('RUKNY_API_KEY')
request['Idempotency-Key'] = 'welcome_user_001'
request.body = JSON.generate({
  from: 'noreply@yourdomain.com',
  to: ['user@example.com'],
  subject: 'Hello World',
  bodyText: 'It works!'
})

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

raise response.body unless response.is_a?(Net::HTTPSuccess)
puts response.body`,
        language: 'ruby',
      },
      {
        id: 'faraday',
        title: 'Faraday',
        code: `require 'faraday'
require 'json'

conn = Faraday.new(url: '${SEND_URL}') do |f|
  f.request :json
  f.response :raise_error
end

response = conn.post do |req|
  req.headers['X-API-Key'] = ENV.fetch('RUKNY_API_KEY')
  req.headers['Idempotency-Key'] = 'welcome_user_001'
  req.body = {
    from: 'noreply@yourdomain.com',
    to: ['user@example.com'],
    subject: 'Hello World',
    bodyText: 'It works!'
  }
end

puts response.body`,
        language: 'ruby',
      },
    ],
  },
  {
    id: 'python',
    label: 'Python',
    description: 'Send with requests, httpx, or Django/FastAPI backends.',
    prerequisites: ['Python 3.9+', 'API key with email:send'],
    sections: [
      {
        id: 'requests',
        title: 'requests',
        code: `import os
import requests

response = requests.post(
    '${SEND_URL}',
    headers={
        'X-API-Key': os.environ['RUKNY_API_KEY'],
        'Idempotency-Key': 'welcome_user_001',
    },
    json={
        'from': 'noreply@yourdomain.com',
        'to': ['user@example.com'],
        'subject': 'Hello World',
        'bodyText': 'It works!',
    },
    timeout=30,
)
response.raise_for_status()
print(response.json())`,
        language: 'python',
      },
      {
        id: 'fastapi',
        title: 'FastAPI route',
        code: `import os
import httpx
from fastapi import APIRouter

router = APIRouter()

@router.post('/notify')
async def notify(email: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            '${SEND_URL}',
            headers={
                'X-API-Key': os.environ['RUKNY_API_KEY'],
                'Idempotency-Key': f'notify_{email}',
            },
            json={
                'from': 'noreply@yourdomain.com',
                'to': [email],
                'subject': 'Hello',
                'bodyText': 'It works!',
            },
        )
        response.raise_for_status()
        return response.json()`,
        language: 'python',
      },
    ],
  },
  {
    id: 'go',
    label: 'Go',
    description: 'Send with the standard net/http package or any HTTP client.',
    prerequisites: ['Go 1.21+', 'API key with email:send'],
    sections: [
      {
        id: 'net-http',
        title: 'net/http',
        code: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func main() {
	payload := map[string]interface{}{
		"from":     "noreply@yourdomain.com",
		"to":       []string{"user@example.com"},
		"subject":  "Hello World",
		"bodyText": "It works!",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest(http.MethodPost, "${SEND_URL}", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", os.Getenv("RUKNY_API_KEY"))
	req.Header.Set("Idempotency-Key", "welcome_user_001")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		panic(fmt.Sprintf("send failed: %s", res.Status))
	}
	fmt.Println("sent")
}`,
        language: 'go',
      },
    ],
  },
  {
    id: 'rust',
    label: 'Rust',
    description: 'Send with reqwest from Axum, Actix, or CLI tools.',
    prerequisites: ['Rust 1.70+', 'reqwest with json feature'],
    sections: [
      {
        id: 'reqwest',
        title: 'reqwest',
        code: `use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), reqwest::Error> {
    let client = Client::new();
    let response = client
        .post("${SEND_URL}")
        .header("X-API-Key", std::env::var("RUKNY_API_KEY").expect("RUKNY_API_KEY"))
        .header("Idempotency-Key", "welcome_user_001")
        .json(&json!({
            "from": "noreply@yourdomain.com",
            "to": ["user@example.com"],
            "subject": "Hello World",
            "bodyText": "It works!"
        }))
        .send()
        .await?;

    response.error_for_status()?;
    println!("{}", response.text().await?);
    Ok(())
}`,
        language: 'rust',
      },
    ],
  },
  {
    id: 'elixir',
    label: 'Elixir',
    description: 'Send from Phoenix or plain Elixir with Req or HTTPoison.',
    prerequisites: ['Elixir 1.14+', 'API key with email:send'],
    sections: [
      {
        id: 'req',
        title: 'Req',
        code: `Req.post!("${SEND_URL}",
  headers: [
    {"x-api-key", System.get_env("RUKNY_API_KEY")},
    {"idempotency-key", "welcome_user_001"}
  ],
  json: %{
    from: "noreply@yourdomain.com",
    to: ["user@example.com"],
    subject: "Hello World",
    bodyText: "It works!"
  }
)`,
        language: 'elixir',
      },
      {
        id: 'phoenix',
        title: 'Phoenix controller',
        code: `defmodule MyAppWeb.NotifyController do
  use MyAppWeb, :controller

  def create(conn, %{"email" => email}) do
    {:ok, %{status: 200, body: body}} =
      Req.post("${SEND_URL}",
        headers: [
          {"x-api-key", System.get_env("RUKNY_API_KEY")},
          {"idempotency-key", "welcome_#{email}"}
        ],
        json: %{
          from: "noreply@yourdomain.com",
          to: [email],
          subject: "Hello",
          bodyText: "It works!"
        }
      )

    json(conn, Jason.decode!(body))
  end
end`,
        language: 'elixir',
      },
    ],
  },
  {
    id: 'java',
    label: 'Java',
    description: 'Send with Java 11+ HttpClient from Spring Boot or plain Java.',
    prerequisites: ['Java 11+', 'API key with email:send'],
    sections: [
      {
        id: 'httpclient',
        title: 'HttpClient',
        code: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class SendEmail {
  public static void main(String[] args) throws Exception {
    String json = """
      {
        "from": "noreply@yourdomain.com",
        "to": ["user@example.com"],
        "subject": "Hello World",
        "bodyText": "It works!"
      }
      """;

    HttpRequest request = HttpRequest.newBuilder()
      .uri(URI.create("${SEND_URL}"))
      .header("Content-Type", "application/json")
      .header("X-API-Key", System.getenv("RUKNY_API_KEY"))
      .header("Idempotency-Key", "welcome_user_001")
      .POST(HttpRequest.BodyPublishers.ofString(json))
      .build();

    HttpResponse<String> response = HttpClient.newHttpClient()
      .send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() >= 400) {
      throw new RuntimeException(response.body());
    }

    System.out.println(response.body());
  }
}`,
        language: 'java',
      },
    ],
  },
  {
    id: 'dotnet',
    label: '.NET',
    description: 'Send with HttpClient from ASP.NET Core or console apps. SMTP also works via MailKit.',
    prerequisites: ['.NET 6+', 'API key with email:send'],
    sections: [
      {
        id: 'httpclient',
        title: 'HttpClient',
        code: `using System.Net.Http.Json;

var client = new HttpClient();
client.DefaultRequestHeaders.Add("X-API-Key", Environment.GetEnvironmentVariable("RUKNY_API_KEY"));
client.DefaultRequestHeaders.Add("Idempotency-Key", "welcome_user_001");

var payload = new {
    from = "noreply@yourdomain.com",
    to = new[] { "user@example.com" },
    subject = "Hello World",
    bodyText = "It works!"
};

var response = await client.PostAsJsonAsync("${SEND_URL}", payload);
response.EnsureSuccessStatusCode();
Console.WriteLine(await response.Content.ReadAsStringAsync());`,
        language: 'csharp',
      },
      {
        id: 'smtp',
        title: 'SMTP (MailKit)',
        code: `using MailKit.Net.Smtp;
using MimeKit;

var message = new MimeMessage();
message.From.Add(new MailboxAddress("Your App", "noreply@yourdomain.com"));
message.To.Add(MailboxAddress.Parse("user@example.com"));
message.Subject = "Hello World";
message.Body = new TextPart("html") { Text = "<p>It works!</p>" };

using var client = new SmtpClient();
await client.ConnectAsync("${SMTP_HOST}", 587, MailKit.Security.SecureSocketOptions.StartTls);
await client.AuthenticateAsync("${SMTP_USER}", Environment.GetEnvironmentVariable("RUKNY_API_KEY"));
await client.SendAsync(message);
await client.DisconnectAsync(true);`,
        language: 'csharp',
      },
    ],
  },
  {
    id: 'smtp',
    label: 'SMTP',
    description:
      'Connect any SMTP client — Laravel, Nodemailer, WordPress, Django — with your API key as the password.',
    prerequisites: [
      'API key with email:send scope',
      'Verified domain and authorized sender for the From address',
    ],
    sections: [
      {
        id: 'credentials',
        title: 'Credentials',
        code: `Host: ${SMTP_HOST}
Port: 587 (STARTTLS) or 465 (SMTPS)
Username: ${SMTP_USER}
Password: ${API_KEY}`,
        language: 'text',
      },
      {
        id: 'nodemailer',
        title: 'Nodemailer',
        code: `import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: '${SMTP_HOST}',
  port: 587,
  secure: false,
  auth: {
    user: '${SMTP_USER}',
    pass: process.env.RUKNY_API_KEY,
  },
});

await transporter.sendMail({
  from: 'noreply@yourdomain.com',
  to: 'user@example.com',
  subject: 'Hello World',
  html: '<strong>It works!</strong>',
});`,
        language: 'javascript',
      },
      {
        id: 'laravel',
        title: 'Laravel',
        code: `MAIL_MAILER=smtp
MAIL_HOST=${SMTP_HOST}
MAIL_PORT=587
MAIL_USERNAME=${SMTP_USER}
MAIL_PASSWORD=rk_live_your_api_key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com`,
        language: 'ini',
      },
      {
        id: 'wordpress',
        title: 'WordPress',
        description: 'Use any SMTP plugin (WP Mail SMTP, FluentSMTP, etc.) with the credentials above.',
        code: `SMTP Host: ${SMTP_HOST}
SMTP Port: 587
Encryption: TLS
Authentication: Yes
Username: ${SMTP_USER}
Password: rk_live_your_api_key`,
        language: 'text',
      },
    ],
  },
  {
    id: 'cli',
    label: 'CLI',
    description: 'Send and check status from curl or shell scripts without an SDK.',
    prerequisites: ['curl 7.x+', 'API key with email:send (and email:read for status)'],
    sections: [
      {
        id: 'send',
        title: 'Send',
        code: `curl -X POST '${SEND_URL}' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: ${API_KEY}' \\
  -H 'Idempotency-Key: welcome_user_001' \\
  -d '${REST_BODY.replace(/\n/g, '').replace(/'/g, "'\\''")}'`,
        language: 'bash',
      },
      {
        id: 'status',
        title: 'Check status',
        code: `curl '${EMAIL_API_PUBLIC_BASE}/email/messages/em_01hxyz' \\
  -H 'X-API-Key: ${API_KEY}'`,
        language: 'bash',
      },
      {
        id: 'env',
        title: 'Shell helper',
        code: `export RUKNY_API_KEY=rk_live_your_key

rukny_send() {
  curl -sS -X POST '${SEND_URL}' \\
    -H "Content-Type: application/json" \\
    -H "X-API-Key: $RUKNY_API_KEY" \\
    -H "Idempotency-Key: cli_$(date +%s)" \\
    -d "$1"
}`,
        language: 'bash',
      },
    ],
  },
];

const sendBase = '/documentation/email-api/send';

export function getSendExample(id: string): SendExample | undefined {
  return SEND_EXAMPLES.find((item) => item.id === id);
}

export function getSendExampleNavHref(id: SendExampleId): string {
  return `${sendBase}/${id}`;
}

export function getSendExamplePager(id: SendExampleId): {
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
} {
  const index = SEND_EXAMPLES.findIndex((item) => item.id === id);
  if (index < 0) return {};
  const prev = index > 0 ? SEND_EXAMPLES[index - 1] : null;
  const next = index < SEND_EXAMPLES.length - 1 ? SEND_EXAMPLES[index + 1] : null;
  return {
    prev: prev
      ? { href: getSendExampleNavHref(prev.id), label: prev.label }
      : { href: sendBase, label: 'Sending examples' },
    next: next ? { href: getSendExampleNavHref(next.id), label: next.label } : undefined,
  };
}

export const SEND_EXAMPLE_NAV_ITEMS = SEND_EXAMPLES.map((item) => ({
  slug: item.id,
  label: item.label,
  href: getSendExampleNavHref(item.id),
}));
