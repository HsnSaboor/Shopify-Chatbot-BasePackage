# Shopify PostMessage Integration Guide

This guide explains how to set up the secure postMessage communication bridge between the Shopify AI Chatbot iframe and the parent Shopify store page.

## Overview

The postMessage communication bridge solves the cookie domain validation issues by allowing the iframe to communicate with the parent Shopify page for cart operations. This ensures that all cart API calls are made from the Shopify domain context, using the native Shopify cookies.

## Implementation Architecture

```
┌─────────────────────────────────────┐
│        Shopify Store Page           │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Shopify Cart Bridge JS    │    │
│  │   (shopify-cart-bridge.js)  │    │
│  │   - Runs in Shopify domain  │    │
│  │   - Handles cart operations │    │
│  │   - Uses native cookies     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Transparent Chatbot       │    │
│  │   Embed Script              │    │
│  │   (transparent-chatbot-     │    │
│  │    embed.js)                │    │
│  │   - Runs in iframe          │    │
│  │   - Uses PostMessageBridge  │    │
│  │   - Sends cart requests     │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
           ▲         │
           │         │
           │         ▼
           │  postMessage
           │  Communication
           │         │
           │         ▼
┌─────────────────────────────────────┐
│        Chatbot Iframe               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Chatbot Application       │    │
│  │   - React/Next.js App       │    │
│  │   - Handles UI/UX           │    │
│  │   - Sends messages to       │    │
│  │     parent via postMessage  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## Installation Steps

### 1. Add the Shopify Cart Bridge Script

Add the cart bridge script to your Shopify theme. This should be added to your `theme.liquid` file, just before the closing `</body>` tag:

```liquid
<!-- Shopify Cart Bridge for Chatbot Integration -->
<script src="{{ 'shopify-cart-bridge.js' | asset_url }}" defer></script>
```

### 2. Upload the Required Files

Upload these files to your Shopify theme assets:

1. `shopify-cart-bridge.js` - The parent page cart bridge script
2. `transparent-chatbot-embed.js` - The enhanced embed script with PostMessage support

### 3. Configure the Transparent Embed

In your `theme.liquid` file, add the transparent embed configuration before the closing `</head>` tag:

```liquid
<!-- Shopify AI Chatbot Transparent Embed -->
<script>
window.CHATBOT_API_URL = "https://your-chatbot-domain.com";
window.SHOPIFY_MINIMAL_DATA = {
  customerId: "{{ customer.id | default: '' }}",
  localization: "{{ request.locale.iso_code | default: 'en' }}",
  cartCurrency: "{{ cart.currency.iso_code | default: 'USD' }}",
  pageType: "{{ request.page_type }}",
  pageHandle: "{{ page.handle | default: product.handle | default: collection.handle | default: '' }}",
  shopDomain: "{{ shop.domain }}"
};
</script>
<script src="{{ 'transparent-chatbot-embed.js' | asset_url }}" async></script>
```

## How It Works

### Message Flow

1. **User Action**: User clicks "Add to Cart" in the chatbot iframe
2. **Iframe Request**: Chatbot sends a postMessage to the parent with cart data
3. **Parent Processing**: Shopify cart bridge receives the message and processes the cart operation
4. **Native API Call**: Bridge makes the actual API call using Shopify's native context and cookies
5. **Response**: Bridge sends the result back to the iframe via postMessage
6. **UI Update**: Chatbot updates the UI with success/failure information

### Supported Operations

The bridge supports these operations:

- `CART_ADD_ITEM` - Add item to cart
- `CART_GET` - Get current cart contents
- `CART_UPDATE` - Update cart items
- `CART_CLEAR` - Clear entire cart
- `NAVIGATE_TO_CART` - Navigate to cart page
- `NAVIGATE_TO_CHECKOUT` - Navigate to checkout page
- `GET_STORE_INFO` - Get store information

## Security Features

### Origin Validation

The bridge implements strict origin validation to prevent unauthorized access:

```javascript
static isAllowedOrigin(origin) {
  // Allow same origin
  if (origin === window.location.origin) {
    return true;
  }

  // Check against allowed origins list
  return CART_BRIDGE_CONFIG.allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin === origin) return true;
    
    // Allow subdomains for localhost
    if (allowedOrigin.includes('localhost') && origin.includes('localhost')) {
      return true;
    }
    
    return false;
  });
}
```

### Message Structure Validation

All messages are validated for proper structure before processing:

```javascript
// Validate message structure
if (!event.data || typeof event.data !== 'object' || !event.data.type) {
  CartBridgeLogger.warn('Validation', 'Invalid message structure:', event.data);
  return;
}
```

## Configuration

### Bridge Configuration

The bridge can be configured through the `CART_BRIDGE_CONFIG` object:

```javascript
const CART_BRIDGE_CONFIG = {
  version: '1.0.0',
  allowedOrigins: [
    'https://shopify-ai-chatbot-v2.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    // Add your chatbot domain here
  ],
  debug: true,
  timeout: 5000,
  retryAttempts: 2,
  endpoints: {
    addToCart: '/cart/add.js',
    getCart: '/cart.js',
    updateCart: '/cart/update.js',
    clearCart: '/cart/clear.js',
    cartPage: '/cart',
    checkoutPage: '/checkout'
  }
};
```

### Chatbot Configuration

The chatbot embed script also has enhanced configuration for the PostMessage bridge:

```javascript
const CHATBOT_CONFIG = {
  // ... other config
  cart: {
    popup: {
      autoCloseDelay: 3000,
      zIndex: "10000",
      mobileHeight: "100vh",
      desktopHeight: "600px"
    },
    variants: {
      supportedSizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
      colorAutoSelect: true,
      sizeRequired: true
    },
    retryAttempts: 2,
    timeout: 5000,
    validateVariants: true
  }
};
```

## Troubleshooting

### Common Issues

1. **Bridge Not Initializing**: Check that the `shopify-cart-bridge.js` is loaded correctly
2. **Messages Not Being Received**: Verify origin configuration matches your deployment
3. **Cart Operations Failing**: Ensure Shopify API endpoints are accessible

### Debugging

Enable debug mode in both scripts to see detailed logs:

```javascript
// In shopify-cart-bridge.js
const CART_BRIDGE_CONFIG = {
  debug: true,
  // ...
};

// In transparent-chatbot-embed.js
const CHATBOT_CONFIG = {
  debug: true,
  logging: {
    level: 'debug',
    // ...
  }
};
```

## Testing

### Manual Testing

1. Add the scripts to your Shopify theme
2. Open your store in a browser
3. Open browser developer tools
4. Interact with the chatbot and observe the console logs
5. Verify that cart operations work correctly

### Automated Testing

The included `debug-validation-test.html` page can be used to test the integration:

1. Access `/debug-validation-test.html` on your store
2. Run the "Cookie Extraction & Domain Validation Test"
3. Run the "Cart API Integration Test"
4. Check that all tests pass

## Migration from Previous Version

If you're upgrading from a previous version:

1. Replace `transparent-chatbot-embed.js` with the new version
2. Add `shopify-cart-bridge.js` to your theme assets
3. Update your theme configuration as shown above
4. Test the integration thoroughly

## Support

For issues with the integration, check:

1. Browser console for error messages
2. Network tab for failed requests
3. Ensure all required files are uploaded to Shopify
4. Verify origin configuration matches your deployment

The postMessage bridge ensures secure, reliable communication between the chatbot iframe and Shopify store, solving all cookie domain validation issues while maintaining full cart functionality.