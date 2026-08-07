import { test, expect } from '@playwright/test';
import { registerAndLogin, unique } from './helpers';

test.describe('Comments', () => {
  let authHeader: { Authorization: string };
  let slug: string;

  test.beforeEach(async ({ request }) => {
    // create user -> login -> get token
    const token = await registerAndLogin(request);
    authHeader = { Authorization: `Token ${token}` };

    // create article -> get its slug
    const createRes = await request.post('/articles', {
      headers: authHeader,
      data: { 
        article: { 
          title: unique('Comments Test'),
          description: 'd',
          body: 'b' 
        } 
      },
    });
    
    slug = (await createRes.json()).article.slug;
  });

  test.describe('CRUD', () => {
    test('create a comment and read it', async ({ request }) => {
      const commentRes = await request.post(`/articles/${slug}/comments`, {
        headers: authHeader,
        data: { comment: { body: 'Great article!' } },
      });

      expect(commentRes.status()).toBe(201);
      const comment = (await commentRes.json()).comment;
      expect(comment.body).toBe('Great article!');
      expect(comment.id).toBeTruthy();
    });

    test('list comments and confirm the created comment is present', async({ request }) => {
      const commentRes = await request.post(`/articles/${slug}/comments`, {
        headers: authHeader,
        data: { comment: { body: 'Lovely article!' } },
      });
      
      expect(commentRes.status()).toBe(201);

      const created = (await commentRes.json()).comment;
      const commentId = created.id;

      const listRes = await request.get(`/articles/${slug}/comments`, {
        headers: authHeader
      });

      expect(listRes.ok()).toBeTruthy();

      const body = await listRes.json();
      const mine = body.comments.find((c: any) => c.id === commentId);
      expect(mine).toBeTruthy();
      expect(mine.body).toBe('Lovely article!');
    });

    test(`delete a comment and confirm it's gone`, async({ request }) => {
      const commentRes = await request.post(`/articles/${slug}/comments`, {
        headers: authHeader,
        data: { comment: { body: 'Nice article!' } },
      });

      expect(commentRes.status()).toBe(201);

      const created = (await commentRes.json()).comment;
      const commentId = created.id;

      const deleteRes = await request.delete(`/articles/${slug}/comments/${commentId}`, {
        headers: authHeader,
      });

      expect(deleteRes.ok()).toBeTruthy();

      const listRes = await request.get(`/articles/${slug}/comments`, {
        headers: authHeader
      });

      const body = await listRes.json();
      const mine = body.comments.find((c: any) => c.id === commentId);
      expect(mine).toBeFalsy();
      });
    });

  test.describe('Comments failures', () => {
    test('creating a comment with an empty body should be rejected', async ({ request }) => {
      const article = {
        title: unique('Add Invalid Comment Test'),
        description: 'd',
        body: 'b',
      };

      const createRes = await request.post('/articles', {
        headers: authHeader,
        data: { article }
      });
    
      expect(createRes.status()).toBe(201);
      const slug = (await createRes.json()).article.slug;

      const commentRes = await request.post(`/articles/${slug}/comments`, {
        headers: authHeader,
        data: { comment: { body: "" } }
      });

      expect(commentRes.status()).toBe(400);

      const errorBody = await commentRes.json();
      expect(errorBody.errors.body).toContain('must not be blank');
    });
  });
});