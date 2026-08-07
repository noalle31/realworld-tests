import { APIRequestContext, expect } from '@playwright/test';

// Makes a collision-proof unique string for emails, titles, etc.
export function unique(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

// Registers a fresh user, logs in, and returns their auth token.
export async function registerAndLogin(request: APIRequestContext): Promise<string> {
  const name = unique('qa_user');
  const user = { username: name, email: `${name}@example.com`, password: 'Password123!' };

  const reg = await request.post('/users', { data: { user } });
  expect(reg.ok()).toBeTruthy();

  const login = await request.post('/users/login', {
    data: { user: { email: user.email, password: user.password } },
  });
  expect(login.ok()).toBeTruthy();

  const token = (await login.json()).user.token;
  expect(token).toBeTruthy();
  return token;
}