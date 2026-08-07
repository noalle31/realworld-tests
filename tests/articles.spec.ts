import { test, expect } from '@playwright/test';
import { registerAndLogin, unique } from './helpers';

test.describe('Article CRUD', () => {
  let authHeader: { Authorization: string };

  // Before each test, get a fresh logged-in user and build the auth header once.
  test.beforeEach(async ({ request }) => {
    const token = await registerAndLogin(request);
    authHeader = { Authorization: `Token ${token}` };
  });
  
  test('create an article, then read it back by slug', async ({ request }) => {
    const article = {
      title: unique('Test Article'),
      description: 'A short description',
      body: 'The body of the article.',
      tagList: ['testing', 'playwright'],
    };

    // Create (needs token) -> expect 201
    const createRes = await request.post('/articles', {
      headers: authHeader,
      data: { article },
    });

    expect(createRes.status()).toBe(201);
    const created = (await createRes.json()).article; 
    expect(created.title).toBe(article.title);
    expect(created.slug).toBeTruthy();

    // Read it back (public, no token) and confirm it matches
    const getRes = await request.get(`/articles/${created.slug}`);
    expect(getRes.ok()).toBeTruthy();
    const fetched = (await getRes.json()).article;
    expect(fetched.title).toBe(article.title);
    expect(fetched.body).toBe(article.body);
  });

  test('add a comment to an article', async ({ request }) => {
    // Need an article first
    const createRes = await request.post('/articles', {
      headers: authHeader,
      data: { article: { title: unique('Commentable'), description: 'd', body: 'b' } },
    });
    const slug = (await createRes.json()).article.slug;

    // Post a comment -> expect 201, body echoed back
    const commentRes = await request.post(`/articles/${slug}/comments`, {
      headers: authHeader,
      data: { comment: { body: 'Great article!' } },
    });
    expect(commentRes.status()).toBe(201);
    const comment = (await commentRes.json()).comment;
    expect(comment.body).toBe('Great article!');
    expect(comment.id).toBeTruthy();
  });

  test('delete an article and confirm it is gone', async ({ request }) => {
    const createRes = await request.post('/articles', {
      headers: authHeader,
      data: { article: { title: unique('Deletable'), description: 'd', body: 'b' } },
    });
    const slug = (await createRes.json()).article.slug;

    // Delete it (needs token)
    const deleteRes = await request.delete(`/articles/${slug}`, { headers: authHeader });
    expect(deleteRes.ok()).toBeTruthy();

    // Reading it again should now fail (article no longer exists)
    const getRes = await request.get(`/articles/${slug}`);
    expect(getRes.ok()).toBeFalsy();
  });

  test('update an article and confirm the changes persist', async ({ request }) => {
    // Create an article to edit
    const createRes = await request.post('/articles', {
      headers: authHeader,
      data: {
        article: {
          title: unique('Editable'),
          description: 'original description',
          body: 'original body',
        },
      },
    });
    const slug = (await createRes.json()).article.slug;

    // Update description + body only (title untouched, so the slug stays valid)
    const updateRes = await request.put(`/articles/${slug}`, {
      headers: authHeader,
      data: { article: { description: 'updated description', body: 'updated body' } },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = (await updateRes.json()).article;
    expect(updated.description).toBe('updated description');
    expect(updated.body).toBe('updated body');

    // Read it back to confirm the change actually stuck in the database
    const getRes = await request.get(`/articles/${slug}`);
    const fetched = (await getRes.json()).article;
    expect(fetched.body).toBe('updated body');
  });
});