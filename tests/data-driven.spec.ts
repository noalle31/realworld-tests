import { test, expect } from '@playwright/test';
import { unique } from './helpers';

const invalidCases = [
    { name: 'blank username', override: { username: ''}, expectedField: 'username' } ,
    { name: 'blank password', override: { password: ''}, expectedField: 'password' },
    { name: 'blank email', override: { email: ''}, expectedField: 'email' },
    { name: 'invalid email', override: { email: 'not-an-email'}, expectedField: 'email' },
];

for (const testCase of invalidCases) {
  test(`registration is rejected: ${testCase.name}`, async({ request }) => {
    const name = unique('user_qa');
    const user = {
      username: name,
      email: `${name}@example.com`,
      password: 'Password123!',
      ...testCase.override
    };

    const registerRes = await request.post('/users', { data : { user } });
    expect(registerRes.status()).toBe(400);

    const body = await registerRes.json();
    expect(body.errors).toHaveProperty(testCase.expectedField);
  });
};