// E2E TEST: mở app thật trong trình duyệt thật, đi đúng luồng người dùng
import { expect, test } from '@playwright/test';

test('chat với An, đổi sang Binh, đóng chat', async ({ page }) => {
  await page.goto('/');
  const chat = page.getByRole('region', { name: 'Chat with An' });
  await expect(chat.getByRole('listitem')).toHaveCount(2, { timeout: 3000 }); // server giả gửi 1 tin/giây
  await expect(page).toHaveTitle('(2) An | Messenger');

  await page.getByRole('button', { name: 'Binh', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Chat with Binh' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Chat with An' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Close chat' }).click();
  await expect(page).toHaveTitle('Facebook');
});
