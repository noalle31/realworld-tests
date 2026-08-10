import { test, expect } from '@playwright/test';
import { unique, registerAndLogin, createArticle } from './helpers';

test.describe('Articles', () => {
  test.describe('CRUD', () => {
    let authHeader: { Authorization: string };

    test.beforeEach(async ({ request }) => {
      const token = await registerAndLogin(request);
      authHeader = { Authorization: `Token ${token}` };
    });

    test('create an article + read it', async ({ request }) => {
      const article = {
        title: unique('Article Test'),
        description: 'A short description',
        body: 'The body of the article.',
        tagList: ['testing', 'playwright'],
      };

      const createRes = await request.post('/articles', {
        headers: authHeader,
        data: { article },
      });

      expect(createRes.status()).toBe(201);
      const created = (await createRes.json()).article;
      expect(created.title).toBe(article.title);
      expect(created.slug).toBeTruthy();

      const getRes = await request.get(`/articles/${created.slug}`);
      expect(getRes.ok()).toBeTruthy();
      const fetched = (await getRes.json()).article;
      expect(fetched.title).toBe(article.title);
      expect(fetched.body).toBe(article.body);
    });

    test('update an article and confirm the changes persist', async ({ request }) => {
      const slug = await createArticle(request, authHeader);

      const updateRes = await request.put(`/articles/${slug}`, {
        headers: authHeader,
        data: {
          article: {
            description: 'updated description',
            body: 'updated body',
          },
        },
      });
      expect(updateRes.ok()).toBeTruthy();
      const updated = (await updateRes.json()).article;
      expect(updated.description).toBe('updated description');
      expect(updated.body).toBe('updated body');

      const getRes = await request.get(`/articles/${slug}`);
      const fetched = (await getRes.json()).article;
      expect(fetched.body).toBe('updated body');
    });

    test('delete an article and confirm it is gone', async ({ request }) => {
      const slug = await createArticle(request, authHeader);

      const deleteRes = await request.delete(`/articles/${slug}`,
        { headers: authHeader });
      expect(deleteRes.ok()).toBeTruthy();

      const getRes = await request.get(`/articles/${slug}`);
      expect(getRes.ok()).toBeFalsy();
    });
  });

  test.describe('Article authentication failures', () => {
    test('creating an article without a token should be rejected', async ({ request }) => {
      const article = {
        title: unique('Authentication Fail Test'),
        description: 'A short description',
        body: 'The body of the article.',
        tagList: ['testing', 'playwright'],
      };

      const createRes = await request.post('/articles', {
        data: { article },
      });

      expect(createRes.status()).toBe(401);
    });
  });

  test.describe('Article authorization failures', () => {
    test('deleting an article with a different user should be rejected', async ({ request }) => {
      const ownerToken = await registerAndLogin(request);
      const otherToken = await registerAndLogin(request);

      const article = {
        title: unique('Authorization Failed Test'),
        description: 'A short description',
        body: 'The body of the article.',
        tagList: ['testing', 'playwright'],
      };

      const createRes = await request.post('/articles', {
        headers: { Authorization: `Token ${ownerToken}` },
        data: { article },
      });

      expect(createRes.status()).toBe(201);
      const slug = (await createRes.json()).article.slug;

      const deleteRes = await request.delete(`/articles/${slug}`, {
        headers: { Authorization: `Token ${otherToken}` },
      });

      expect(deleteRes.status()).toBe(403);

      const getRes = await request.get(`/articles/${slug}`);
      expect(getRes.ok()).toBeTruthy();
    });
  });
});
