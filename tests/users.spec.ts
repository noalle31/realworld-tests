import { test, expect } from '@playwright/test';
import { unique } from './helpers';

test('register -> login -> use token to reach a protected endpoint', async ({ request }) => {
  const name = unique('user_qa');
  const user = {
    username: name,
    email: `${name}@example.com`,
    password: 'Password123!',
  };

  const registerRes = await request.post('/users', {
    data: { user },
  });
  expect(registerRes.ok()).toBeTruthy();
  const registered = await registerRes.json();
  expect(registered.user.email).toBe(user.email);

  const loginRes = await request.post('/users/login', {
    data: { 
      user: { 
      email: user.email, 
      password: user.password 
      } 
    },
  });
  
  expect(loginRes.ok()).toBeTruthy();

  const token = (await loginRes.json()).user.token;
  expect(token).toBeTruthy();

  const userRes = await request.get('/user', {
    headers: { Authorization: `Token ${token}` },
  });
  expect(userRes.ok()).toBeTruthy();
  const body = await userRes.json();
  expect(body.user.email).toBe(user.email);
  expect(body.user.username).toBe(user.username);
});

test('register -> login with valid email + wrong password', async ({ request }) => {
    const name = unique('user_qa');
    const user = {
      username: name,
      email: `${name}@example.com`,
      password: 'Password123!',
    };

    const registerRes = await request.post('/users', {
      data: { user },
    });
    
    expect(registerRes.ok()).toBeTruthy();
    const registered = await registerRes.json();
    expect(registered.user.email).toBe(user.email);

    const loginRes = await request.post('/users/login', {
      data: { 
        user: { 
          email: user.email, 
          password: 'abc123' 
        } 
      },
    });

    expect(loginRes.status()).toBe(401);
});