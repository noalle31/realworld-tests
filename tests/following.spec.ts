import { test, expect } from '@playwright/test';
import { register, registerAndLogin } from './helpers';

test.describe('Following', () => {
  let authHeader: { Authorization: string };
  let userB: string;

  test.beforeEach(async ({ request }) => {
    const token = await registerAndLogin(request);
    authHeader = { Authorization: `Token ${token}` };

    userB = await register(request);
  });

  test('follow and unfollow flips the following state', async ({ request }) => {
    let res = await request.get(`/profiles/${userB}`, { headers: authHeader });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).profile.following).toBeFalsy();

    res = await request.post(`/profiles/${userB}/follow`, { headers: authHeader });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).profile.following).toBeTruthy();

    res = await request.delete(`/profiles/${userB}/follow`, { headers: authHeader });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).profile.following).toBeFalsy();
  });
});