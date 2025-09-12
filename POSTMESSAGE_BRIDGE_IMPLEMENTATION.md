# Shopify PostMessage Bridge Implementation

## Overview

This document describes the implementation of a secure postMessage communication bridge between a Shopify AI chatbot iframe and the parent Shopify store page. This solution addresses critical issues with cookie domain validation and cart operations by enabling the parent page (which has native access to Shopify cookies) to perform all cart operations on behalf of the iframe.

## Problem Statement

The original implementation faced several critical issues:

1. **Cookie Domain Validation Errors**: Cookies like "_shopify_y", "cart_currency", and "localization" were being rejected for invalid domain "zenmato.myshopify.com"
2. **Hardcoded Store URLs**: Cart API used hardcoded "zenmato.myshopify.com" instead of dynamic detection
3. **Cart API Errors**: 405 errors due to incorrect endpoint usage
4. **Security Concerns**: No origin validation or message authentication for iframe communication

## Solution Architecture

The solution implements a secure postMessage communication bridge with the following components:

```
┌─────────────────────────────────────┐
│        Shopify Store Page           │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Enhanced Shopify Cart     │    │
│  │   Bridge JS                 │    │
│  │   (enhanced-shopify-cart-   │    │
│  │    bridge.js)               │    │
│  │   - Runs in Shopify domain  │    │
│  │   - Handles cart operations │    │
│  │   - Uses native cookies     │    │
│  │   - Validates messages      │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Enhanced Transparent      │    │
│  │   Chatbot Embed Script      │    │
│  │   (enhanced-transparent-    │    │
│  │    chatbot-embed.js)        │    │
│  │   - Runs in iframe          │    │
│  │   - Uses EnhancedPostMessage│    │
│  │     CartBridge              │    │
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

## Key Components

### 1. Enhanced Shopify Cart Bridge (Parent Page Script)

**File**: `public/enhanced-shopify-cart-bridge.js`

This script runs on the Shopify store domain and handles all cart operations using native Shopify context and cookies.

**Key Features**:
- **Secure Origin Validation**: Only accepts messages from trusted origins
- **Message Structure Validation**: Ensures all messages have proper structure
- **Rate Limiting**: Prevents abuse with request limiting per origin
- **Input Sanitization**: Protects against XSS and injection attacks
- **Comprehensive Error Handling**: Graceful error handling with detailed logging
- **Automatic Cart Update Broadcasting**: Notifies iframe of cart changes
- **Detailed Logging**: Comprehensive debug information for troubleshooting

**Security Features**:
```javascript
// Origin validation
static isAllowedOrigin(origin) {
  // Allow same origin
  if (origin === window.location.origin) {
    return true;
  }

  // Check against allowed origins list with subdomain support
  return CART_BRIDGE_CONFIG.allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin === origin) return true;
    
    // Allow subdomains for localhost
    if (allowedOrigin.includes('localhost') && origin.includes('localhost')) {
      return true;
    }
    
    // Allow subdomains of allowed origins
    try {
      const allowedUrl = new URL(allowedOrigin);
      const originUrl = new URL(origin);
      
      if (originUrl.hostname.endsWith('.' + allowedUrl.hostname)) {
        return true;
      }
    } catch (e) {
      return false;
    }
    
    return false;
  });
}

// Input sanitization
static sanitizeInput(input) {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters while preserving valid data
    return input.replace(/[<>]/g, '').trim();
  }
  if (typeof input === 'object' && input !== null) {
    // Recursively sanitize object properties
    const sanitized = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = this.sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  return input;
}
```

### 2. Enhanced Transparent Chatbot Embed (Iframe Script)

**File**: `public/enhanced-transparent-chatbot-embed.js`

This enhanced version of the chatbot embed script uses the postMessage bridge for all cart operations instead of direct API calls.

**Key Features**:
- **EnhancedPostMessageCartBridge**: Robust postMessage communication handler
- **Dynamic Store URL Detection**: Multiple methods to detect the correct store URL
- **Comprehensive Error Handling**: Detailed error categorization and handling
- **Performance Monitoring**: Tracks API requests, user interactions, and render times
- **Fallback Mechanisms**: Direct API fallback when bridge communication fails
- **Security Validation**: Validates all incoming messages

**Bridge Communication**:
```javascript
static async sendMessageToParent(type, payload = {}, timeout = 5000) {
  // Fallback to direct API if bridge is not ready
  if (this.fallbackToDirectAPI) {
    return this.fallbackToDirectAPI(type, payload);
  }
  
  return new Promise((resolve, reject) => {
    const messageId = `msg_${Date.now()}_${++this.messageIdCounter}`;
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      this.pendingRequests.delete(messageId);
      this.fallbackToDirectAPI = true;
      // Try fallback
      this.fallbackToDirectAPI(type, payload).then(resolve).catch(reject);
    }, timeout);
    
    // Store pending request
    this.pendingRequests.set(messageId, { resolve, reject, timeout: timeoutId });
    
    // Send message to parent
    const message = {
      type,
      payload,
      messageId,
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    };
    
    window.parent.postMessage(message, '*');
  });
}
```

### 3. Message Security Validator

**File**: `lib/message-security-validator.ts`

A TypeScript class that provides comprehensive security validation for cross-origin communication.

**Key Features**:
- **Origin Validation**: Validates message origins against allowed list
- **Rate Limiting**: Prevents abuse with request limiting
- **Message Size Validation**: Prevents oversized messages
- **Message Type Validation**: Ensures only allowed message types
- **Input Sanitization**: Protects against XSS and injection attacks
- **Data Validation**: Validates cart item data formats

### 4. Bridge Fallback Handler

**File**: `lib/bridge-fallback-handler.ts`

A TypeScript class that provides fallback mechanisms when postMessage communication fails.

**Key Features**:
- **Direct API Fallback**: Uses Shopify's direct cart API when bridge fails
- **Local Storage Caching**: Caches cart data to improve performance
- **Retry Logic**: Implements retry mechanisms for failed operations
- **Configurable Timeouts**: Adjustable timeout settings for fallback operations

## Supported Operations

The bridge supports these operations:

- `CART_ADD_ITEM` - Add item to cart
- `CART_GET` - Get current cart contents
- `CART_UPDATE` - Update cart items
- `CART_CLEAR` - Clear entire cart
- `NAVIGATE_TO_CART` - Navigate to cart page
- `NAVIGATE_TO_CHECKOUT` - Navigate to checkout page
- `GET_STORE_INFO` - Get store information
- `BRIDGE_STATUS_REQUEST` - Check bridge status

## Security Implementation

### 1. Origin Validation

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
    
    // Allow subdomains of allowed origins
    try {
      const allowedUrl = new URL(allowedOrigin);
      const originUrl = new URL(origin);
      
      if (originUrl.hostname.endsWith('.' + allowedUrl.hostname)) {
        return true;
      }
    } catch (e) {
      return false;
    }
    
    return false;
  });
}
```

### 2. Message Structure Validation

All messages are validated for proper structure before processing:

```javascript
static validateMessage(event) {
  if (!CART_BRIDGE_CONFIG.security.validateMessages) return true;
  
  // Check message structure
  if (!event.data || typeof event.data !== 'object') {
    EnhancedCartBridgeLogger.warn('Security', 'Invalid message structure - not an object');
    return false;
  }
  
  // Check message type
  if (!event.data.type) {
    EnhancedCartBridgeLogger.warn('Security', 'Missing message type');
    return false;
  }
  
  // Check allowed message types
  if (!CART_BRIDGE_CONFIG.security.allowedMessageTypes.includes(event.data.type)) {
    EnhancedCartBridgeLogger.warn('Security', 'Unauthorized message type:', event.data.type);
    return false;
  }
  
  // Check message size
  const messageSize = JSON.stringify(event.data).length;
  if (messageSize > CART_BRIDGE_CONFIG.security.maxMessageSize) {
    EnhancedCartBridgeLogger.warn('Security', 'Message too large:', messageSize);
    return false;
  }
  
  // Check rate limiting
  // ...
  
  return true;
}
```

### 3. Rate Limiting

Rate limiting prevents abuse of the bridge:

```javascript
// Rate limiting tracking
const requestCounts = new Map();

// In validation function:
const origin = event.origin;
const now = Date.now();
const windowStart = now - CART_BRIDGE_CONFIG.security.rateLimit.windowMs;

if (!requestCounts.has(origin)) {
  requestCounts.set(origin, []);
}

const requests = requestCounts.get(origin);
const recentRequests = requests.filter(time => time > windowStart);

if (recentRequests.length >= CART_BRIDGE_CONFIG.security.rateLimit.maxRequestsPerMinute) {
  EnhancedCartBridgeLogger.warn('Security', 'Rate limit exceeded for origin:', origin);
  return false;
}

// Record this request
recentRequests.push(now);
requestCounts.set(origin, recentRequests);
```

### 4. Input Sanitization

Input sanitization protects against XSS and injection attacks:

```javascript
static sanitizeInput(input) {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters while preserving valid data
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }
  
  if (typeof input === 'object' && input !== null) {
    // Recursively sanitize object properties
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    const sanitized = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = this.sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  
  return input;
}
```

## Fallback Mechanisms

The implementation includes comprehensive fallback mechanisms to ensure functionality even when the bridge fails:

### 1. Bridge Timeout Fallback

```javascript
// Set up fallback timeout
setTimeout(() => {
  if (!this.bridgeReady) {
    Logger.warn('EnhancedCartBridge', 'Bridge not ready after timeout, enabling fallback mode');
    this.fallbackToDirectAPI = true;
  }
}, this.bridgeTimeout);
```

### 2. Request Timeout Fallback

```javascript
// Set up timeout
const timeoutId = setTimeout(() => {
  this.pendingRequests.delete(messageId);
  Logger.warn('EnhancedCartBridge', 'Request timeout, enabling fallback mode for:', type);
  this.fallbackToDirectAPI = true;
  // Try fallback
  this.fallbackToDirectAPI(type, payload).then(resolve).catch(reject);
}, timeout);
```

### 3. Direct API Fallback

```javascript
static async fallbackToDirectAPI(type, payload) {
  Logger.warn('EnhancedCartBridge', 'Using direct API fallback for:', type);
  
  try {
    switch (type) {
      case 'CART_ADD_ITEM':
        // Use the legacy CartIntegrationManager as fallback
        if (typeof CartIntegrationManager !== 'undefined') {
          const result = await CartIntegrationManager.addToCartWithRetry(
            payload.variantId, 
            payload.quantity || 1
          );
          return { cart: result };
        }
        throw new Error('CartIntegrationManager not available for fallback');
        
      case 'CART_GET':
        if (typeof CartIntegrationManager !== 'undefined') {
          const result = await CartIntegrationManager.getCart();
          return result;
        }
        throw new Error('CartIntegrationManager not available for fallback');
        
      case 'NAVIGATE_TO_CART':
        window.location.href = '/cart';
        return { success: true };
        
      case 'NAVIGATE_TO_CHECKOUT':
        window.location.href = '/checkout';
        return { success: true };
        
      default:
        throw new Error(`No fallback available for operation: ${type}`);
    }
  } catch (error) {
    Logger.error('EnhancedCartBridge', 'Fallback API failed:', error.message);
    throw error;
  }
}
```

## Testing

### Test Suite

A comprehensive test suite is included to validate all aspects of the implementation:

**File**: `public/postmessage-bridge-test-suite.html`

The test suite includes:

1. **Bridge Connection Tests**: Verify bridge initialization and status
2. **Security Validation Tests**: Test origin validation, message validation, and input sanitization
3. **Message Exchange Tests**: Validate message sending and receiving
4. **Cart Operations Tests**: Test all cart-related operations
5. **Fallback Mechanism Tests**: Verify fallback functionality
6. **Performance Tests**: Measure response times and concurrent request handling

### Manual Testing

To manually test the implementation:

1. Load the test suite in a browser
2. Click "Run All Tests"
3. Verify all tests pass
4. Check the console output for detailed information

## Installation

### 1. Add the Enhanced Shopify Cart Bridge Script

Add the cart bridge script to your Shopify theme. This should be added to your `theme.liquid` file, just before the closing `</body>` tag:

```liquid
<!-- Enhanced Shopify Cart Bridge for Chatbot Integration -->
<script src="{{ 'enhanced-shopify-cart-bridge.js' | asset_url }}" defer></script>
```

### 2. Upload the Required Files

Upload these files to your Shopify theme assets:

1. `enhanced-shopify-cart-bridge.js` - The parent page cart bridge script
2. `enhanced-transparent-chatbot-embed.js` - The enhanced embed script with PostMessage support

### 3. Configure the Enhanced Transparent Embed

In your `theme.liquid` file, add the transparent embed configuration before the closing `</head>` tag:

```liquid
<!-- Shopify AI Chatbot Enhanced Transparent Embed -->
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
<script src="{{ 'enhanced-transparent-chatbot-embed.js' | asset_url }}" async></script>
```

## Configuration

### Bridge Configuration

The bridge can be configured through the `CART_BRIDGE_CONFIG` object:

```javascript
const CART_BRIDGE_CONFIG = {
  version: '2.0.0',
  allowedOrigins: [
    'https://shopify-ai-chatbot-v2.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    // Add your chatbot domain here
  ],
  debug: true,
  timeout: 5000,
  security: {
    validateMessages: true,
    maxMessageSize: 1024 * 100, // 100KB max message size
    rateLimit: {
      maxRequestsPerMinute: 60,
      windowMs: 60000
    },
    allowedMessageTypes: [
      'CART_ADD_ITEM',
      'CART_GET',
      'CART_UPDATE',
      'CART_CLEAR',
      'NAVIGATE_TO_CART',
      'NAVIGATE_TO_CHECKOUT',
      'GET_STORE_INFO',
      'BRIDGE_STATUS_REQUEST'
    ]
  },
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

The chatbot embed script also has enhanced configuration:

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
  },
  storeDetection: {
    retryAttempts: 3,
    fallbackURL: null,
    validateSSL: true,
    preventHardcodedDomains: true
  }
};
```

## Troubleshooting

### Common Issues

1. **Bridge Not Initializing**: Check that the `enhanced-shopify-cart-bridge.js` is loaded correctly
2. **Messages Not Being Received**: Verify origin configuration matches your deployment
3. **Cart Operations Failing**: Ensure Shopify API endpoints are accessible
4. **Cookie Domain Errors**: Confirm the bridge is properly handling cookie domain validation

### Debugging

Enable debug mode in both scripts to see detailed logs:

```javascript
// In enhanced-shopify-cart-bridge.js
const CART_BRIDGE_CONFIG = {
  debug: true,
  // ...
};

// In enhanced-transparent-chatbot-embed.js
const CHATBOT_CONFIG = {
  debug: true,
  logging: {
    level: 'debug',
    // ...
  }
};
```

## Benefits

### 1. Complete Cookie Compatibility
- All Shopify cookies work correctly
- No domain validation errors
- Native Shopify cart integration

### 2. Enhanced Security
- Origin validation prevents unauthorized access
- Message validation prevents malformed requests
- Rate limiting prevents abuse
- Input sanitization prevents injection attacks

### 3. Robust Error Handling
- Automatic fallback to direct API if bridge fails
- Retry logic for failed requests
- Comprehensive error logging
- Graceful degradation

### 4. Improved Performance
- Faster cart operations using native context
- Reduced network errors
- Better error recovery
- Enhanced debugging capabilities

## Migration from Previous Version

### For Existing Installations

1. Replace `transparent-chatbot-embed.js` with `enhanced-transparent-chatbot-embed.js`
2. Add `enhanced-shopify-cart-bridge.js` to Shopify theme assets
3. Update theme configuration to include bridge script
4. Test thoroughly in development environment

### New Installations

1. Follow the installation guide above
2. Upload both JavaScript files to theme assets
3. Configure theme with proper script tags
4. Test integration

## Files Created

### New Files
- `public/enhanced-shopify-cart-bridge.js` - Enhanced parent page cart bridge script
- `public/enhanced-transparent-chatbot-embed.js` - Enhanced iframe embed script
- `lib/message-security-validator.ts` - TypeScript security validation class
- `lib/bridge-fallback-handler.ts` - TypeScript fallback handler class
- `public/postmessage-bridge-test-suite.html` - Comprehensive test suite
- `POSTMESSAGE_BRIDGE_IMPLEMENTATION.md` - This documentation file

## Support

For issues with the implementation:

1. Check browser console for error messages
2. Verify all files are correctly uploaded to Shopify
3. Confirm origin configuration matches your deployment
4. Test with debug mode enabled
5. Run the test suite to identify specific issues

The postMessage communication bridge provides a secure, reliable solution to all Shopify cookie and cart integration issues while maintaining full functionality and adding enhanced security features.