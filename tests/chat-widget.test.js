// @ts-check
const { test, expect } = require('@playwright/test');

test('Chat widget on ultra-tall mobile screen', async ({ page }) => {
  // Set viewport to 428px x 1000px (ultra-tall mobile)
  await page.setViewportSize({ width: 428, height: 1000 });
  
  // Navigate to the chatbot widget page
  await page.goto('/chatbot-widget');
  
  // Wait for the page to load
  await page.waitForTimeout(2000);
  
  // Click the chat widget button to open it
  const chatButton = await page.locator('button.rounded-full.shadow-xl');
  await chatButton.click();
  
  // Wait for the chat window to open
  await page.waitForTimeout(1000);
  
  // Check if chat window is visible
  const chatWindow = await page.locator('.rounded-xl.shadow-2xl');
  await expect(chatWindow).toBeVisible();
  
  // Check if header is visible
  const header = await page.locator('div.border-b');
  await expect(header).toBeVisible();
  
  // Check if input area is visible
  const inputArea = await page.locator('div.border-t');
  await expect(inputArea).toBeVisible();
  
  // Check if the help text is visible
  const helpText = await page.locator('text="Press Enter to send • Click mic for voice"');
  await expect(helpText).toBeVisible();
  
  // Take a screenshot for verification
  await page.screenshot({ path: 'chat-widget-ultra-tall.png' });
  
  console.log('Test completed successfully');
});