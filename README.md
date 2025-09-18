# Shopify AI Chatbot Widget

A redistributable Shopify AI chatbot widget that can be embedded into any Shopify store.

## Overview

This is a Next.js application that provides an AI-powered chatbot for Shopify stores. Unlike the original hardcoded version, this widget dynamically configures itself based on the store it's embedded in, making it suitable for distribution across multiple Shopify stores.

## Features

- AI-powered product recommendations
- Order tracking and status updates
- Shopping cart integration
- Voice messaging support
- Responsive design for mobile and desktop
- Customizable styling that adapts to store themes
- Cross-origin communication security

## Installation

### For Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd shopify-ai-chatbot-widget
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### For Shopify Stores

1. Build the application:
   ```bash
   pnpm run build
   ```

2. Upload the `public/transparent-chatbot-embed.js` file to your Shopify theme assets.

3. Add the following script tag to your Shopify theme's `theme.liquid` file, just before the closing `</body>` tag:
   ```liquid
   <script 
     src="{{ 'transparent-chatbot-embed.js' | asset_url }}" 
     async>
   </script>
   ```

### Configuration Options

The widget can be configured using data attributes on the script tag:

| Attribute | Description | Default |
|-----------|-------------|---------|
| `data-api-url` | The base URL for the chatbot API | Current domain |
| `data-domain` | The Shopify store domain | Current domain |

For more advanced customization, you can pass configuration options directly to the chatbot component:

```jsx
<ChatbotWidget
  chatHeader={{
    name: "Custom Assistant Name",
    tagline: "Your custom tagline",
    backgroundColor: "#667eea"
  }}
  userMessage={{
    backgroundColor: "#f093fb"
  }}
  avatar={{
    imageUrl: "/path/to/avatar.png",
    borderStyle: "2px solid #ffffff",
    showBorder: true
  }}
/>
```

#### Chat Header Customization
- `name`: Custom name for the chatbot assistant
- `tagline`: Custom status message/tagline
- `backgroundColor`: Solid color for the header background

#### User Message Customization
- `backgroundColor`: Solid color for user message bubbles

#### Avatar Customization
- `imageUrl`: Custom avatar image URL
- `borderStyle`: CSS border style for the avatar
- `showBorder`: Boolean to show/hide avatar border

## Project Structure

- `app/` - Next.js app router pages and API routes
- `components/` - React components including the chatbot widget
- `hooks/` - Custom React hooks
- `lib/` - Utility functions and service integrations
- `public/` - Static assets including the embed script
- `styles/` - Global styles and Tailwind configuration

## API Endpoints

### Configuration
- `GET /api/config` - Get store-specific configuration
- `POST /api/config` - Update store configuration

### Chat
- `POST /api/chat` - Send/receive chat messages



## Redistributable Features

This version has been modified to be redistributable across multiple Shopify stores:

1. **Dynamic Configuration**: Automatically adapts to the store it's embedded in
2. **Flexible Origins**: Secure cross-origin communication with any Shopify store
3. **Configurable API**: Support for custom API endpoints per store
4. **Theme Integration**: Automatically inherits store fonts and styling

For more details on the redistributable implementation, see:
- [REDISTRIBUTABLE_GUIDE.md](REDISTRIBUTABLE_GUIDE.md)
- [REDISTRIBUTABLE_SUMMARY.md](REDISTRIBUTABLE_SUMMARY.md)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.