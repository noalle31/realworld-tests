import { test, expect } from '@playwright/test';
import { registerAndLogin, createArticle, createComment } from './helpers';

test.describe('Comments', () => {
  let authHeader: { Authorization: string };
  let slug: string;

  test.beforeEach(async ({ request }) => {
    // create user -> login -> get token
    const token = await registerAndLogin(request);
    authHeader = { Authorization: `Token ${token}` };

    // create article -> get slug
    slug = await createArticle(request, authHeader);
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
      const commentId = await createComment(request, authHeader, slug, 'Lovely article!')
      
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
      const commentId = await createComment(request, authHeader, slug, 'Nice article!')

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