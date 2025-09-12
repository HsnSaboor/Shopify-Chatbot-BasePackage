/**
 * Shopify Cart Bridge Script
 * This script runs on the Shopify store domain and handles cart operations
 * through postMessage communication with the chatbot iframe.
 * 
 * It leverages the native Shopify domain cookies to perform cart operations
 * without cross-domain cookie issues.
 */

(() => {
  'use strict';

  // Configuration for the cart bridge
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
    },
    security: {
      validateMessages: true,
      maxMessageSize: 1024 * 100, // 100KB max message size
      rateLimit: {
        maxRequestsPerMinute: 60,
        windowMs: 60000
      }
    }
  };

  // Rate limiting tracking
  const requestCounts = new Map();
  
  // Logger for the cart bridge
  class CartBridgeLogger {
    static log(level, context, ...args) {
      if (!CART_BRIDGE_CONFIG.debug) return;
      
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [SHOPIFY-CART-BRIDGE] [${level.toUpperCase()}] [${context}]`;
      
      const consoleMethod = console[level] || console.log;
      consoleMethod(logMessage, ...args);
    }
    
    static info(context, ...args) { this.log('info', context, ...args); }
    static warn(context, ...args) { this.log('warn', context, ...args); }
    static error(context, ...args) { this.log('error', context, ...args); }
    static debug(context, ...args) { this.log('debug', context, ...args); }
  }

  // Security validation
  class SecurityValidator {
    static validateMessage(event) {
      if (!CART_BRIDGE_CONFIG.security.validateMessages) return true;
      
      // Check message size
      const messageSize = JSON.stringify(event.data).length;
      if (messageSize > CART_BRIDGE_CONFIG.security.maxMessageSize) {
        CartBridgeLogger.warn('Security', 'Message too large:', messageSize);
        return false;
      }
      
      // Check rate limiting
      const origin = event.origin;
      const now = Date.now();
      const windowStart = now - CART_BRIDGE_CONFIG.security.rateLimit.windowMs;
      
      if (!requestCounts.has(origin)) {
        requestCounts.set(origin, []);
      }
      
      const requests = requestCounts.get(origin);
      const recentRequests = requests.filter(time => time > windowStart);
      
      if (recentRequests.length >= CART_BRIDGE_CONFIG.security.rateLimit.maxRequestsPerMinute) {
        CartBridgeLogger.warn('Security', 'Rate limit exceeded for origin:', origin);
        return false;
      }
      
      // Record this request
      recentRequests.push(now);
      requestCounts.set(origin, recentRequests);
      
      return true;
    }
    
    static sanitizeInput(input) {
      if (typeof input === 'string') {
        // Remove potentially dangerous characters
        return input.replace(/[<>]/g, '');
      }
      return input;
    }
  }

  // Cart API service that uses native Shopify domain
  class ShopifyCartAPI {
    static async addToCart(variantId, quantity = 1, properties = {}) {
      CartBridgeLogger.info('CartAPI', 'Adding to cart:', { variantId, quantity, properties });
      
      const requestBody = {
        items: [{
          id: parseInt(variantId),
          quantity: quantity,
          properties: properties
        }]
      };

      try {
        const response = await this.makeRequest('POST', CART_BRIDGE_CONFIG.endpoints.addToCart, requestBody);
        const result = await response.json();
        
        CartBridgeLogger.info('CartAPI', 'Successfully added to cart:', result);
        return {
          success: true,
          data: result,
          cart: await this.getCart()
        };
      } catch (error) {
        CartBridgeLogger.error('CartAPI', 'Failed to add to cart:', error.message);
        throw error;
      }
    }

    static async getCart() {
      CartBridgeLogger.debug('CartAPI', 'Fetching cart...');
      
      try {
        const response = await this.makeRequest('GET', CART_BRIDGE_CONFIG.endpoints.getCart);
        const cart = await response.json();
        
        const formattedCart = {
          items: cart.items.map(item => ({
            id: item.id.toString(),
            variantId: item.variant_id.toString(),
            quantity: item.quantity,
            name: item.product_title,
            price: this.formatPrice(item.price, cart.currency),
            image: item.image,
            url: item.url,
            vendor: item.vendor,
            properties: item.properties || {}
          })),
          total_price: cart.total_price,
          item_count: cart.item_count,
          currency: cart.currency,
          total_discount: cart.total_discount,
          cart_level_discount_applications: cart.cart_level_discount_applications || []
        };
        
        CartBridgeLogger.debug('CartAPI', 'Cart retrieved:', formattedCart);
        return formattedCart;
      } catch (error) {
        CartBridgeLogger.error('CartAPI', 'Failed to get cart:', error.message);
        throw error;
      }
    }

    static async updateCart(updates) {
      CartBridgeLogger.info('CartAPI', 'Updating cart:', updates);
      
      try {
        const response = await this.makeRequest('POST', CART_BRIDGE_CONFIG.endpoints.updateCart, { updates });
        const result = await response.json();
        
        CartBridgeLogger.info('CartAPI', 'Cart updated successfully');
        return {
          success: true,
          data: result,
          cart: await this.getCart()
        };
      } catch (error) {
        CartBridgeLogger.error('CartAPI', 'Failed to update cart:', error.message);
        throw error;
      }
    }

    static async clearCart() {
      CartBridgeLogger.info('CartAPI', 'Clearing cart...');
      
      try {
        const response = await this.makeRequest('POST', CART_BRIDGE_CONFIG.endpoints.clearCart);
        
        CartBridgeLogger.info('CartAPI', 'Cart cleared successfully');
        return {
          success: true,
          cart: await this.getCart()
        };
      } catch (error) {
        CartBridgeLogger.error('CartAPI', 'Failed to clear cart:', error.message);
        throw error;
      }
    }

    static navigateToCart() {
      CartBridgeLogger.info('Navigation', 'Navigating to cart page');
      window.location.href = CART_BRIDGE_CONFIG.endpoints.cartPage;
    }

    static navigateToCheckout() {
      CartBridgeLogger.info('Navigation', 'Navigating to checkout page');
      window.location.href = CART_BRIDGE_CONFIG.endpoints.checkoutPage;
    }

    static async makeRequest(method, endpoint, body = null) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CART_BRIDGE_CONFIG.timeout);

      try {
        const options = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          signal: controller.signal
        };

        if (body && method !== 'GET') {
          options.body = JSON.stringify(body);
        }

        const response = await fetch(endpoint, options);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw error;
      }
    }

    static formatPrice(price, currency = 'USD') {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
        }).format(price / 100); // Shopify prices are in cents
      } catch (error) {
        return `$${(price / 100).toFixed(2)}`;
      }
    }
  }

  // Message handler for iframe communication
  class CartBridgeMessageHandler {
    static handleMessage(event) {
      // Security validation
      if (!SecurityValidator.validateMessage(event)) {
        CartBridgeLogger.warn('Security', 'Message failed security validation');
        return;
      }

      // Validate origin
      if (!this.isAllowedOrigin(event.origin)) {
        CartBridgeLogger.warn('Security', 'Message from unauthorized origin:', event.origin);
        return;
      }

      // Validate message structure
      if (!event.data || typeof event.data !== 'object' || !event.data.type) {
        CartBridgeLogger.warn('Validation', 'Invalid message structure:', event.data);
        return;
      }

      const { type, payload, messageId } = event.data;
      
      CartBridgeLogger.debug('MessageHandler', 'Received message:', { type, payload, messageId });

      // Handle different message types
      this.processMessage(type, payload, messageId, event.source, event.origin);
    }

    static async processMessage(type, payload, messageId, source, origin) {
      try {
        let result;

        switch (type) {
          case 'CART_ADD_ITEM':
            result = await ShopifyCartAPI.addToCart(
              SecurityValidator.sanitizeInput(payload.variantId),
              payload.quantity || 1,
              payload.properties || {}
            );
            break;

          case 'CART_GET':
            result = await ShopifyCartAPI.getCart();
            break;

          case 'CART_UPDATE':
            result = await ShopifyCartAPI.updateCart(payload.updates);
            break;

          case 'CART_CLEAR':
            result = await ShopifyCartAPI.clearCart();
            break;

          case 'NAVIGATE_TO_CART':
            ShopifyCartAPI.navigateToCart();
            result = { success: true, action: 'navigation_started' };
            break;

          case 'NAVIGATE_TO_CHECKOUT':
            ShopifyCartAPI.navigateToCheckout();
            result = { success: true, action: 'navigation_started' };
            break;

          case 'GET_STORE_INFO':
            result = this.getStoreInfo();
            break;

          case 'BRIDGE_STATUS_REQUEST':
            // Respond with bridge ready status
            this.sendResponse(source, origin, messageId, {
              success: true,
              type: 'BRIDGE_READY',
              data: {
                version: CART_BRIDGE_CONFIG.version,
                storeInfo: this.getStoreInfo()
              }
            });
            return;

          default:
            throw new Error(`Unknown message type: ${type}`);
        }

        // Send success response
        this.sendResponse(source, origin, messageId, {
          success: true,
          type: `${type}_SUCCESS`,
          data: result
        });

      } catch (error) {
        CartBridgeLogger.error('MessageHandler', 'Error processing message:', error.message);
        
        // Send error response
        this.sendResponse(source, origin, messageId, {
          success: false,
          type: `${type}_ERROR`,
          error: {
            message: error.message,
            code: error.code || 'UNKNOWN_ERROR'
          }
        });
      }
    }

    static sendResponse(source, origin, messageId, data) {
      // Validate that we have a valid source
      if (!source || !source.postMessage) {
        CartBridgeLogger.warn('MessageHandler', 'Invalid message source, cannot send response');
        return;
      }
      
      const response = {
        ...data,
        messageId,
        timestamp: new Date().toISOString()
      };

      CartBridgeLogger.debug('MessageHandler', 'Sending response:', response);
      source.postMessage(response, origin);
    }

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

    static getStoreInfo() {
      return {
        domain: window.location.hostname,
        origin: window.location.origin,
        currency: window.Shopify?.currency?.active || 'USD',
        country: window.Shopify?.country || 'US',
        locale: window.Shopify?.locale || 'en',
        shop: window.Shopify?.shop || window.location.hostname,
        theme: {
          id: window.Shopify?.theme?.id || null,
          name: window.Shopify?.theme?.name || null
        },
        customer: window.Shopify?.customer ? {
          id: window.Shopify.customer.id,
          email: window.Shopify.customer.email,
          first_name: window.Shopify.customer.first_name,
          last_name: window.Shopify.customer.last_name
        } : null
      };
    }
  }

  // Initialize the cart bridge
  class ShopifyCartBridge {
    static init() {
      CartBridgeLogger.info('Bridge', 'Initializing Shopify Cart Bridge v' + CART_BRIDGE_CONFIG.version);
      
      // Add message event listener
      window.addEventListener('message', (event) => {
        CartBridgeMessageHandler.handleMessage(event);
      });

      // Initialize cart count tracking
      this.initCartCountTracking();

      // Mark bridge as ready
      window.SHOPIFY_CART_BRIDGE_READY = true;
      
      CartBridgeLogger.info('Bridge', 'Cart bridge initialized successfully');

      // Notify any waiting chatbot iframes
      this.notifyBridgeReady();
    }

    static initCartCountTracking() {
      // Track cart count changes and notify iframe
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        
        // Check if this was a cart-related request
        const url = args[0];
        if (typeof url === 'string' && (url.includes('/cart/') || url.includes('cart.js'))) {
          // Small delay to allow cart to update
          setTimeout(() => {
            ShopifyCartBridge.broadcastCartUpdate();
          }, 100);
        }
        
        return response;
      };
    }

    static async broadcastCartUpdate() {
      try {
        const cart = await ShopifyCartAPI.getCart();
        const message = {
          type: 'CART_UPDATED',
          data: cart,
          timestamp: new Date().toISOString()
        };

        // Broadcast to all chatbot iframes
        const iframes = document.querySelectorAll('iframe[id*="chatbot"]');
        iframes.forEach(iframe => {
          if (iframe.contentWindow) {
            CART_BRIDGE_CONFIG.allowedOrigins.forEach(origin => {
              iframe.contentWindow.postMessage(message, origin);
            });
          }
        });
      } catch (error) {
        CartBridgeLogger.warn('Bridge', 'Failed to broadcast cart update:', error.message);
      }
    }

    static notifyBridgeReady() {
      const message = {
        type: 'BRIDGE_READY',
        data: {
          version: CART_BRIDGE_CONFIG.version,
          storeInfo: CartBridgeMessageHandler.getStoreInfo()
        },
        timestamp: new Date().toISOString()
      };

      // Notify all chatbot iframes
      setTimeout(() => {
        const iframes = document.querySelectorAll('iframe[id*="chatbot"]');
        iframes.forEach(iframe => {
          if (iframe.contentWindow) {
            CART_BRIDGE_CONFIG.allowedOrigins.forEach(origin => {
              iframe.contentWindow.postMessage(message, origin);
            });
          }
        });
      }, 500); // Small delay to ensure iframes are loaded
    }
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ShopifyCartBridge.init();
    });
  } else {
    ShopifyCartBridge.init();
  }

  // Expose bridge for manual initialization if needed
  window.ShopifyCartBridge = ShopifyCartBridge;
  
  CartBridgeLogger.info('Bridge', 'Shopify Cart Bridge script loaded successfully');

})();