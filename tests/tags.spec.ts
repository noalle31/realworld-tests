import { test, expect } from '@playwright/test';
import { unique, registerAndLogin } from './helpers';

test.describe('Tags', () => {
  let authHeader: { Authorization: string };
  
  test.beforeEach(async ({ request }) => {
    const token = await registerAndLogin(request);
    authHeader = { Authorization: `Token ${token}` };
  });
  
  test('create an article with tags and assert these tags appear', async ({ request }) => {
    const article = { 
      title: unique('Article Title'),
      description: 'A short description',
      body: 'The body of the article.',
      tagList: [ 'testing', 'playwright', 'api' ],
    };

    const createRes = await request.post('/articles', {
      headers: authHeader,
      data: { article }
    });

    expect(createRes.ok()).toBeTruthy();

    const tagsRes = await request.get('/tags');
    expect(tagsRes.ok()).toBeTruthy();

    const body = await tagsRes.json();
    const tags = await body.tags;

    for (const tag of article.tagList) {
      expect(tags).toContain(tag);
    };
  });
});