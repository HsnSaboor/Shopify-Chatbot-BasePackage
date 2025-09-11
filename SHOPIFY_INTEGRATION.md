# Shopify AI Chatbot Integration Guide

## Overview
This guide explains how to integrate the AI chatbot widget into your Shopify store. The chatbot provides intelligent product recommendations, order assistance, and seamless cart integration.

## Features
- **Smart Product Recommendations**: AI-powered product suggestions based on customer queries
- **Add to Cart Integration**: Direct product additions to Shopify cart from chat
- **Persistent Conversations**: Chat state maintained across page navigation
- **Voice Messages**: Support for voice input and responses
- **Mobile Responsive**: Optimized for all device sizes
- **Auto-Reopen**: Chatbot reopens automatically when navigating between pages

## Installation

### Step 1: Add the Embed Script
Add the following script to your Shopify theme's `theme.liquid` file, just before the closing `</body>` tag:

\`\`\`html
<!-- AI Chatbot Widget -->
<script>
  window.CHATBOT_API_URL = 'https://your-chatbot-domain.com';
</script>
<script src="https://your-chatbot-domain.com/chatbot-embed.js" async></script>
\`\`\`

### Step 2: Configure Environment Variables
Set up the following environment variables in your chatbot application:

- `CHATBOT_WEBHOOK_URL`: Your AI webhook endpoint
- `CHATBOT_AUTH_TOKEN`: Authentication token for webhook requests

### Step 3: Customize Appearance (Optional)
You can customize the chatbot's appearance by modifying the CSS variables:

\`\`\`html
<style>
  :root {
    --chatbot-primary-color: #2563eb;
    --chatbot-secondary-color: #f3f4f6;
    --chatbot-text-color: #1f2937;
    --chatbot-border-radius: 12px;
  }
</style>
\`\`\`

## API Integration

### Webhook Endpoint
The chatbot sends requests to your webhook endpoint with the following structure:

\`\`\`json
{
  "type": "text",
  "message": "User's message",
  "cart_currency": "USD",
  "localization": "en-US",
  "timestamp": 1640995200
}
\`\`\`

### Expected Response Format
Your webhook should respond with:

\`\`\`json
{
  "message": "AI response text",
  "event_type": "product_recommendation",
  "cards": [
    {
      "id": "product-123",
      "variantId": "variant-456",
      "name": "Product Name",
      "image": "https://example.com/image.jpg",
      "price": "$29.99",
      "url": "https://store.com/products/product-name",
      "variants": [
        {
          "size": "M",
          "color": "Blue",
          "variantId": "variant-789"
        }
      ]
    }
  ]
}
\`\`\`

## JavaScript API

### Manual Control
You can control the chatbot programmatically:

\`\`\`javascript
// Open the chatbot
window.ShopifyAIChatbot.open();

// Close the chatbot
window.ShopifyAIChatbot.close();

// Clear chat history
window.ShopifyAIChatbot.clearHistory();

// Update configuration
window.ShopifyAIChatbot.setConfig({
  debug: true,
  autoReopenDelay: 2000
});
\`\`\`

### Event Listeners
Listen for chatbot events:

\`\`\`javascript
window.addEventListener('message', function(event) {
  if (event.data.type === 'CHATBOT_STATE_CHANGED') {
    console.log('Chatbot state:', event.data.data);
  }
});
\`\`\`

## Shopify Cart Integration

### Automatic Cart Updates
The chatbot automatically integrates with Shopify's cart system using the `/cart/add.js` endpoint. When customers add products through the chat:

1. Product is added to Shopify cart
2. Confirmation popup displays cart summary
3. Options to view cart or proceed to checkout

### Cart API Compatibility
The integration works with:
- Standard Shopify cart
- Ajax cart implementations
- Third-party cart apps (with standard Shopify API)

## Troubleshooting

### Common Issues

**Chatbot not appearing:**
- Check that the embed script is loaded correctly
- Verify the API URL is accessible
- Check browser console for JavaScript errors

**Cart integration not working:**
- Ensure Shopify cart API is enabled
- Check that variant IDs are correct
- Verify CORS settings allow requests

**State not persisting:**
- Check localStorage is enabled in browser
- Verify domain consistency across pages
- Clear localStorage if corrupted

### Debug Mode
Enable debug mode for detailed logging:

\`\`\`javascript
window.ShopifyAIChatbot.setConfig({ debug: true });
\`\`\`

## Security Considerations

- Always validate webhook requests with authentication tokens
- Sanitize user input before processing
- Use HTTPS for all communications
- Implement rate limiting on your webhook endpoint

## Performance Optimization

- The chatbot loads asynchronously to avoid blocking page load
- State is saved efficiently using localStorage
- Iframe isolation prevents conflicts with store JavaScript

## Support

For technical support or customization requests, contact your development team or the chatbot provider.
