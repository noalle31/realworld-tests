import { test, expect } from '@playwright/test';
import { registerAndLogin, unique } from './helpers';

test.describe('Article authentication failures', () => {
  test('creating an article without a token should be rejected', async ({ request }) => {
    const article = {
      title: unique('Test Article'),
      description: 'A short description',
      body: 'The body of the article.',
      tagList: ['testing', 'playwright'],
    };

    const createRes = await request.post('/articles', {
      data: { article }
    });

    expect(createRes.status()).toBe(401);
  });
});

test.describe('Article authorization failures', () => {
  test('deleting an article with a different user should be rejected', async ({ request }) => {
    const ownerToken = await registerAndLogin(request);
    const otherToken = await registerAndLogin(request);

    const article = {
      title: unique('Test Article'),
      description: 'A short description',
      body: 'The body of the article.',
      tagList: ['testing', 'playwright'],
    };

    const createRes = await request.post('/articles', {
      headers: { Authorization: `Token ${ownerToken}` },
      data: { article }
    });

    expect(createRes.status()).toBe(201);
    const slug = (await createRes.json()).article.slug;

    const deleteRes = await request.delete(`/articles/${slug}`, { 
      headers: { Authorization: `Token ${otherToken}` }
    });

    expect(deleteRes.status()).toBe(403);

    const getRes = await request.get(`/articles/${slug}`);
    expect(getRes.ok()).toBeTruthy();
  });
});
