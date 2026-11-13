import { expect, test } from '@playwright/test';

const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0ioAAAAASUVORK5CYII=';

test.describe('DAYFORM full-stack E2E workflows', () => {
  test('complete user journey, persistence across sign-out/sign-in, and cross-user isolation', async ({
    page,
    request,
    browser
  }) => {
    const suffix = Date.now();
    const userAEmail = `e2e-a-${suffix}@dayform.test`;
    const userBEmail = `e2e-b-${suffix}@dayform.test`;
    const password = 'Password123!';
    const apiBase = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api/v1';

    // 1. Register user A through the UI
    await page.goto('/register');
    await page.getByLabel('Your name').fill('Elena Vance');
    await page.getByLabel('Email').fill(userAEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/$/);

    // 2-3. Create a habit and complete today's check-in
    await page.getByRole('link', { name: 'Habits' }).first().click();
    await page.getByRole('button', { name: 'Add habit' }).first().click();
    await page.getByLabel('Habit name').fill(`Morning Stretch ${suffix}`);
    await page.getByLabel('Target').fill('15 minutes');
    await page.getByRole('button', { name: 'Add habit' }).last().click();
    await expect(page.getByText(`Morning Stretch ${suffix}`)).toBeVisible();
    await page.getByRole('button', { name: `Complete Morning Stretch ${suffix}` }).click();

    // 4-5. Create a learning path and log a study session
    await page.getByRole('link', { name: 'Study' }).first().click();
    await page.getByRole('button', { name: 'New learning path' }).click();
    await page.getByLabel('Title').fill(`System Design ${suffix}`);
    await page.getByRole('button', { name: 'Create path' }).click();
    await expect(page.getByText(`System Design ${suffix}`)).toBeVisible();

    await page.getByRole('button', { name: /Log time/i }).click();
    await page.getByLabel('Topic').fill('Caching Strategies');
    await page.getByLabel('Minutes').fill('40');
    await page.getByRole('button', { name: 'Save session' }).click();
    await expect(page.getByText('Caching Strategies')).toBeVisible();

    // 6. Create a journal entry
    await page.getByRole('button', { name: 'Journal' }).click();
    await page.getByLabel('What did I accomplish today?').fill('Completed full system design study block');
    await page.getByLabel('What distracted me today?').fill('Unscheduled messages');
    await page.getByLabel('What can I improve tomorrow?').fill('Batch messages to 4pm');
    await page.getByRole('button', { name: 'Save reflection' }).click();
    await expect(page.getByText('Reflection saved')).toBeVisible();

    // 7. Create a memory and upload an image (uses configured backend/test storage)
    await page.getByRole('link', { name: 'Memories' }).first().click();
    await page.getByRole('button', { name: 'Add memory' }).first().click();
    await page.getByLabel('Title').fill(`Milestone Snapshot ${suffix}`);
    const pngBuffer = Buffer.from(PNG_1X1_BASE64, 'base64');
    await page.getByLabel('Photo (optional, max 5 MB)').setInputFiles({
      name: 'snapshot.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    await page.getByRole('button', { name: 'Save memory' }).click();
    await expect(page.getByText(`Milestone Snapshot ${suffix}`)).toBeVisible();

    // 8. Create a reminder on Planner
    await page.getByRole('button', { name: 'Planner' }).click();
    await page.getByRole('button', { name: 'Add reminder' }).first().click();
    await page.getByLabel('Reminder title').fill(`Review Notes ${suffix}`);
    await page.getByRole('button', { name: 'Save reminder' }).click();
    await expect(page.getByText(`Review Notes ${suffix}`)).toBeVisible();

    // 9. Verify dashboard and progress values
    await page.getByRole('link', { name: 'Progress' }).first().click();
    await expect(page.getByText('40m')).toBeVisible();
    await page.getByRole('link', { name: 'Home' }).first().click();
    await expect(page.getByText('1 of 1 habits done')).toBeVisible();

    // 10-11. Sign out, sign back in, and verify persisted data remains
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Email').fill(userAEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('1 of 1 habits done')).toBeVisible();

    // 12. Verify a second user cannot access the first user's records
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/register');
    await pageB.getByLabel('Your name').fill('Second User');
    await pageB.getByLabel('Email').fill(userBEmail);
    await pageB.getByLabel('Password').fill(password);
    await pageB.getByRole('button', { name: 'Create account' }).click();
    await expect(pageB).toHaveURL(/\/$/);
    await pageB.getByRole('link', { name: 'Habits' }).first().click();
    await expect(pageB.getByText(`Morning Stretch ${suffix}`)).toHaveCount(0);

    // Direct API isolation check with user B session
    const loginBRes = await request.post(`${apiBase}/auth/login`, {
      data: { email: userBEmail, password }
    });
    expect(loginBRes.ok()).toBeTruthy();
    const loginBJson = await loginBRes.json();
    const habitsBRes = await request.get(`${apiBase}/habits`, {
      headers: { Authorization: `Bearer ${loginBJson.data.accessToken}` }
    });
    const habitsBJson = await habitsBRes.json();
    expect(habitsBJson.data).toHaveLength(0);

    await contextB.close();
  });
});

