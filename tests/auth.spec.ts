import { test, expect } from '@playwright/test';

const stamp = Date.now();
const user = {
  username: `qa_user_${stamp}`,
  email: `qa_user_${stamp}@example.com`,
  password: 'Password123!',
};

test('register -> login -> use token to reach a protected endpoint', async ({ request }) => {
  // 1. Register a new user
  const registerRes = await request.post('/users', {
    data: { user },
  });
  expect(registerRes.ok()).toBeTruthy();
  const registered = await registerRes.json();
  expect(registered.user.email).toBe(user.email);

  // 2. Log in
  const loginRes = await request.post('/users/login', {
    data: { user: { email: user.email, password: user.password } },
  });
  expect(loginRes.ok()).toBeTruthy();

  // 3. Pull the token out of the login response
  const token = (await loginRes.json()).user.token;
  expect(token).toBeTruthy();

  // 4. Use the token to reach the protected /user endpoint
  const userRes = await request.get('/user', {
    headers: { Authorization: `Token ${token}` },
  });
  expect(userRes.ok()).toBeTruthy();
  const body = await userRes.json();
  expect(body.user.email).toBe(user.email);
  expect(body.user.username).toBe(user.username);
});