# AI Chatbot Widget for Shopify

## Environment Setup

Create a `.env.local` file in your project root with:

\`\`\`env
CHATBOT_WEBHOOK_URL=https://your-ai-webhook-endpoint.com/webhook
CHATBOT_AUTH_TOKEN=your-secret-auth-token-here
\`\`\`

## Webhook Configuration

The chatbot sends POST requests to your webhook URL with this format:
\`\`\`json
{
  "type": "text",
  "message": "User's message",
  "cart_currency": "USD",
  "localization": "en-US"
}
\`\`\`

Your webhook should respond with:
\`\`\`json
{
  "message": "AI response",
  "event_type": "product_recommendation",
  "cards": [...]
}
\`\`\`

## Shopify Integration

Add this to your `theme.liquid` file before `</body>`:
\`\`\`html
<script>
  window.CHATBOT_API_URL = "https://your-deployed-chatbot.vercel.app";
</script>
<script src="https://your-deployed-chatbot.vercel.app/chatbot-embed.js"></script>
