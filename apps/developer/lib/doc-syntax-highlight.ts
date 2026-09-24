export type DocCodeLanguage =
  | 'bash'
  | 'typescript'
  | 'javascript'
  | 'php'
  | 'ruby'
  | 'python'
  | 'go'
  | 'rust'
  | 'elixir'
  | 'java'
  | 'csharp'
  | 'ini'
  | 'text';

const KEYWORD =
  'text-[#e8b86d]';
const STRING =
  'text-[#7ee787]';
const COMMENT =
  'text-[#8b949e]';
const FUNCTION =
  'text-[#d2a8ff]';
const TYPE =
  'text-[#79c0ff]';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function span(className: string, value: string): string {
  return `<span class="${className}">${value}</span>`;
}

function highlightStrings(line: string): string {
  return line.replace(
    /('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g,
    (match) => span(STRING, match),
  );
}

function highlightComments(line: string): string {
  if (line.trimStart().startsWith('#')) {
    return span(COMMENT, line);
  }
  return line.replace(/(\/\/.*$|#.*$)/, (match) => span(COMMENT, match));
}

function highlightKeywords(
  line: string,
  keywords: string[],
): string {
  if (!keywords.length) return line;
  const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  return line.replace(pattern, (match) => span(KEYWORD, match));
}

function highlightLine(
  line: string,
  language: DocCodeLanguage,
): string {
  let output = escapeHtml(line);

  if (language === 'bash') {
    if (output.trimStart().startsWith('#')) {
      return span(COMMENT, output);
    }
    output = highlightStrings(output);
    output = output.replace(
      /^(\s*)([a-zA-Z_][\w-]*)/,
      (_, space, cmd) => `${space}${span(KEYWORD, cmd)}`,
    );
    return output;
  }

  if (language === 'ini' || language === 'text') {
    output = highlightStrings(output);
    return output.replace(
      /^([A-Z0-9_]+)(=)/,
      (_, key, eq) => `${span(TYPE, key)}${eq}`,
    );
  }

  output = highlightComments(output);
  output = highlightStrings(output);

  const keywordMap: Partial<Record<DocCodeLanguage, string[]>> = {
    typescript: [
      'import',
      'from',
      'const',
      'let',
      'await',
      'async',
      'export',
      'default',
      'function',
      'return',
      'new',
      'throw',
      'if',
      'typeof',
    ],
    javascript: [
      'import',
      'from',
      'const',
      'let',
      'await',
      'async',
      'export',
      'default',
      'function',
      'return',
      'new',
      'throw',
      'if',
    ],
    php: [
      'require',
      'use',
      'echo',
      'throw',
      'new',
      'function',
      'return',
      'if',
      'array',
      'null',
      'true',
      'false',
    ],
    ruby: [
      'require',
      'def',
      'end',
      'class',
      'module',
      'raise',
      'puts',
      'do',
      'if',
      'unless',
    ],
    python: [
      'import',
      'from',
      'def',
      'async',
      'await',
      'return',
      'raise',
      'print',
      'with',
      'as',
      'class',
      'if',
      'None',
      'True',
      'False',
    ],
    go: [
      'package',
      'import',
      'func',
      'main',
      'var',
      'return',
      'if',
      'panic',
      'defer',
      'nil',
    ],
    rust: [
      'use',
      'fn',
      'let',
      'mut',
      'async',
      'await',
      'return',
      'Ok',
      'Err',
      'pub',
      'struct',
    ],
    elixir: [
      'defmodule',
      'def',
      'do',
      'end',
      'use',
      'import',
      'alias',
      'require',
      'case',
      'cond',
      'fn',
    ],
    java: [
      'import',
      'public',
      'class',
      'static',
      'void',
      'main',
      'throws',
      'new',
      'if',
      'return',
      'String',
      'Exception',
    ],
    csharp: [
      'using',
      'var',
      'await',
      'async',
      'new',
      'class',
      'static',
      'void',
      'return',
      'if',
      'throw',
      'namespace',
      'public',
    ],
  };

  output = highlightKeywords(output, keywordMap[language] ?? []);

  if (language === 'php') {
    output = output.replace(
      /(&lt;\?php)/g,
      (match) => span(KEYWORD, match),
    );
    output = output.replace(
      /(-&gt;)([A-Za-z_][\w]*)/g,
      (_, arrow, method) => `${arrow}${span(FUNCTION, method)}`,
    );
  }

  if (language === 'ruby' || language === 'elixir') {
    output = output.replace(
      /(\.|::)([A-Za-z_][\w]*)/g,
      (_, sep, method) => `${sep}${span(FUNCTION, method)}`,
    );
  }

  if (language === 'typescript' || language === 'javascript') {
    output = output.replace(
      /(\.)((?:send|post|get|json|fetch|createTransport|sendMail)\b)/g,
      (_, dot, method) => `${dot}${span(FUNCTION, method)}`,
    );
  }

  return output;
}

export function highlightDocCode(
  code: string,
  language: DocCodeLanguage = 'text',
): string {
  return code
    .split('\n')
    .map((line) => highlightLine(line, language))
    .join('\n');
}

export function defaultFilenameForLanguage(
  language: DocCodeLanguage,
  title?: string,
): string {
  if (title) {
    const lower = title.toLowerCase();
    if (
      lower.includes('composer') ||
      lower.includes('install') ||
      lower.includes('shell') ||
      lower.includes('cli')
    ) {
      return 'Terminal';
    }
    if (lower.includes('laravel') || lower.includes('.env')) return '.env';
    if (lower.includes('credentials')) return 'smtp.config';
    if (lower.includes('wordpress')) return 'wp-config.php';
  }

  const map: Record<DocCodeLanguage, string> = {
    bash: 'terminal',
    typescript: 'index.ts',
    javascript: 'index.js',
    php: 'index.php',
    ruby: 'send.rb',
    python: 'send.py',
    go: 'main.go',
    rust: 'main.rs',
    elixir: 'send.ex',
    java: 'SendEmail.java',
    csharp: 'Program.cs',
    ini: '.env',
    text: 'config.txt',
  };

  return map[language] ?? 'snippet';
}

export function normalizeDocLanguage(
  language?: string,
): DocCodeLanguage {
  switch (language) {
    case 'bash':
    case 'sh':
    case 'shell':
      return 'bash';
    case 'ts':
    case 'typescript':
      return 'typescript';
    case 'js':
    case 'javascript':
      return 'javascript';
    case 'php':
      return 'php';
    case 'ruby':
    case 'rb':
      return 'ruby';
    case 'py':
    case 'python':
      return 'python';
    case 'go':
    case 'golang':
      return 'go';
    case 'rs':
    case 'rust':
      return 'rust';
    case 'ex':
    case 'elixir':
      return 'elixir';
    case 'java':
      return 'java';
    case 'cs':
    case 'csharp':
    case 'dotnet':
      return 'csharp';
    case 'ini':
    case 'env':
      return 'ini';
    default:
      return 'text';
  }
}
