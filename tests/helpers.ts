import { APIRequestContext, expect } from '@playwright/test';

// Makes a collision-proof unique string for emails, titles, etc.
export function unique(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

// Registers a fresh user, logs in, and returns their auth token.
export async function registerAndLogin(request: APIRequestContext): Promise<string> {
  const name = unique('qa_user');
  const user = { username: name, email: `${name}@example.com`, password: 'Password123!' };

  const register = await request.post('/users', { data: { user } });
  expect(register.ok()).toBeTruthy();

  const login = await request.post('/users/login', {
    data: { user: { email: user.email, password: user.password } },
  });
  expect(login.ok()).toBeTruthy();

  const token = (await login.json()).user.token;
  expect(token).toBeTruthy();
  return token;
}

// create article -> get its slug
export async function createArticle(
  request: APIRequestContext,
  authHeader: { Authorization: string },
): Promise<string> {
  const createRes = await request.post('/articles', {
    headers: authHeader,
    data: { 
      article: { 
        title: unique('Test Article'),
        description: 'Description',
        body: 'A test article body.' 
      } 
    },
  });
  
  expect(createRes.status()).toBe(201);
  return (await createRes.json()).article.slug;
}

// create comment -> get its id
export async function createComment(
  request: APIRequestContext,
  authHeader: { Authorization: string },
  slug: string,
  body: string,
): Promise<number> {
  const commentRes = await request.post(`/articles/${slug}/comments`, {
    headers: authHeader,
    data: { comment: { body } }
  });

  expect(commentRes.status()).toBe(201);
  return (await commentRes.json()).comment.id;
}