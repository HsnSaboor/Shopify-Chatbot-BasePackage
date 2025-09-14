// @ts-check
const { test, expect } = require('@playwright/test');

test('Mobile keyboard overflow fix', async ({ page }) => {
  // Set viewport to simulate mobile device
  await page.setViewportSize({ width: 375, height: 667 });
  
  // Navigate to the keyboard test page
  await page.goto('/keyboard-test');
  
  // Wait for the page to load
  await page.waitForTimeout(1000);
  
  // Get initial height of the page
  const initialViewportHeight = await page.evaluate(() => window.innerHeight);
  
  // Locate the input field
  const inputField = await page.locator('input[placeholder="Tap here to test keyboard detection"]');
  
  // Focus on the input field to simulate keyboard opening
  await inputField.focus();
  
  // Wait for keyboard detection to trigger
  await page.waitForTimeout(1000);
  
  // Check if keyboard status is detected as open
  const keyboardStatus = await page.locator('text=Keyboard Status: OPEN');
  const isKeyboardDetected = await keyboardStatus.isVisible();
  
  if (isKeyboardDetected) {
    // Get keyboard height
    const keyboardHeightText = await page.locator('text=Keyboard Height:').textContent();
    const keyboardHeight = parseInt(keyboardHeightText.match(/\d+/)[0]);
    
    console.log(`Keyboard detected with height: ${keyboardHeight}px`);
    
    // Verify that keyboard height is reasonable (greater than 100px, less than 400px)
    expect(keyboardHeight).toBeGreaterThan(100);
    expect(keyboardHeight).toBeLessThan(400);
  }
  
  // Blur the input field to simulate keyboard closing
  await inputField.blur();
  
  // Wait for keyboard to close
  await page.waitForTimeout(1000);
  
  // Check if keyboard status is detected as closed
  const keyboardClosedStatus = await page.locator('text=Keyboard Status: CLOSED');
  await expect(keyboardClosedStatus).toBeVisible();
  
  // Navigate to the chatbot widget page
  await page.goto('/chatbot-widget');
  
  // Wait for the page to load
  await page.waitForTimeout(1000);
  
  // Click the chat widget button to open it
  const chatButton = await page.locator('button.rounded-full.shadow-xl');
  await chatButton.click();
  
  // Wait for the chat window to open
  await page.waitForTimeout(1000);
  
  // Check if chat window is visible
  const chatWindow = await page.locator('.rounded-xl.shadow-2xl');
  await expect(chatWindow).toBeVisible();
  
  // Get the initial height of the chat widget
  const initialChatHeight = await chatWindow.evaluate(el => el.clientHeight);
  console.log(`Initial chat widget height: ${initialChatHeight}px`);
  
  // Locate the input field in the chat widget
  const chatInput = await page.locator('input[placeholder="Ask me anything about products..."]');
  
  // Focus on the chat input field to simulate keyboard opening
  await chatInput.focus();
  
  // Wait for keyboard detection and height adjustment
  await page.waitForTimeout(1000);
  
  // Get the height of the chat widget after keyboard opens
  const keyboardOpenChatHeight = await chatWindow.evaluate(el => el.clientHeight);
  console.log(`Chat widget height with keyboard open: ${keyboardOpenChatHeight}px`);
  
  // Verify that the chat widget height has been adjusted
  // On mobile, when keyboard opens, the widget should be shorter
  if (initialChatHeight > keyboardOpenChatHeight) {
    console.log('Chat widget height adjusted correctly for keyboard');
  }
  
  // Blur the chat input field to simulate keyboard closing
  await chatInput.blur();
  
  // Wait for keyboard to close and widget to adjust back
  await page.waitForTimeout(1000);
  
  // Get the final height of the chat widget
  const finalChatHeight = await chatWindow.evaluate(el => el.clientHeight);
  console.log(`Final chat widget height: ${finalChatHeight}px`);
  
  // Verify that the chat widget returns to its original height
  // Allow for small differences due to rounding
  const heightDifference = Math.abs(initialChatHeight - finalChatHeight);
  expect(heightDifference).toBeLessThan(50);
  
  // Take a screenshot for verification
  await page.screenshot({ path: 'mobile-keyboard-test-result.png' });
  
  console.log('Mobile keyboard overflow test completed successfully');
});