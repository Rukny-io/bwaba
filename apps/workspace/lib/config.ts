/** Dashboard app — workspace.rukny.io */
export const WORKSPACE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

export const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'http://localhost:3005';

export const API_URL =
  process.env.NEXT_PUBLIC_API_EXTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api/v1';
