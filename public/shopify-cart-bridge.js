/**
 * Enhanced Shopify Cart Bridge Script
 * This script runs on the Shopify store domain and handles cart operations
 * through postMessage communication with the chatbot iframe.
 */

(() => {
  'use strict';
  
  // Enhanced origin validation
  function isAllowedOrigin(origin) {
    // Skip processing if no origin or invalid origin
    if (!origin || origin === 'null') {
      return false;
    }
    
    // Allow same origin
    if (origin === window.location.origin) {
      return true;
    }
    
    // Allow localhost for development
    if (origin.includes('localhost')) {
      return true;
    }
    
    // Allow vercel app for production
    if (origin.includes('shopify-ai-chatbot-v2.vercel.app')) {
      return true;
    }
    
    // Allow Shopify store domain
    if (origin.includes('myshopify.com')) {
      return true;
    }
    
    return false;
  }
  
  // Handle incoming messages
  window.addEventListener('message', (event) => {
    // Skip processing if no origin or invalid origin
    if (!event.origin || event.origin === 'null') {
      return;
    }
    
    // Validate origin
    if (!isAllowedOrigin(event.origin)) {
      // Only log invalid origins periodically to prevent spam
      if (Date.now() % 1000 < 100) { // Rough rate limiting - log ~10% of invalid origin messages
        console.warn('[ShopifyCartBridge] Invalid origin:', event.origin);
      }
      return;
    }
    
    const { type, payload, id } = event.data;
    
    switch (type) {
      case 'CART_ADD_ITEM':
        handleAddToCart(event, payload, id);
        break;
      case 'CART_GET':
        handleGetCart(event, id);
        break;
      case 'NAVIGATE_TO_CART':
        handleNavigateToCart(event, id);
        break;
      case 'NAVIGATE_TO_CHECKOUT':
        handleNavigateToCheckout(event, id);
        break;
      // Add handlers for known message types to prevent errors
      case 'ADD_TO_CART_SUCCESS':
      case 'CHATBOT_READY':
      case 'CHATBOT_STATE_CHANGED':
      case 'CHATBOT_RESIZE':
      case 'CHATBOT_CLOSED_BY_USER':
      case 'CHATBOT_OPENED_BY_USER':
        // Acknowledge these messages but don't process them
        if (id !== undefined) {
          sendResponse(event.source, event.origin, {
            id,
            success: true,
            data: { message: 'Acknowledged' }
          });
        }
        break;
      default:
        // Only log unknown message types periodically to prevent spam
        if (Date.now() % 1000 < 100) { // Rough rate limiting - log ~10% of unknown message types
          console.warn('[ShopifyCartBridge] Unknown message type:', type);
        }
        if (id !== undefined) {
          sendResponse(event.source, event.origin, {
            id,
            success: false,
            error: 'Unknown message type'
          });
        }
    }
  });
  
  // Handle add to cart
  async function handleAddToCart(event, payload, id) {
    try {
      console.log('[ShopifyCartBridge] Adding item to cart:', payload);
      
      const formData = {
        items: [{
          id: payload.variantId,
          quantity: payload.quantity || 1
        }]
      };
      
      console.log('[ShopifyCartBridge] Sending request to /cart/add.js with data:', formData);
      
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(formData)
      });
      
      console.log('[ShopifyCartBridge] Add to cart response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('[ShopifyCartBridge] Add to cart error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('[ShopifyCartBridge] Add to cart result:', result);
      
      const cart = await getCart();
      console.log('[ShopifyCartBridge] Updated cart:', cart);
      
      // Normalize cart data before sending
      const normalizedCart = normalizeCartData(cart);
      
      sendResponse(event.source, event.origin, {
        id,
        success: true,
        data: { 
          result, 
          cart: normalizedCart,
          message: 'Item added to cart successfully'
        }
      });
    } catch (error) {
      console.error('[ShopifyCartBridge] Failed to add to cart:', error);
      sendResponse(event.source, event.origin, {
        id,
        success: false,
        error: error.message || 'Failed to add item to cart'
      });
    }
  }
  
  // Handle get cart
  async function handleGetCart(event, id) {
    try {
      console.log('[ShopifyCartBridge] Getting cart');
      const cart = await getCart();
      console.log('[ShopifyCartBridge] Cart retrieved:', cart);
      
      // Normalize cart data before sending
      const normalizedCart = normalizeCartData(cart);
      
      sendResponse(event.source, event.origin, {
        id,
        success: true,
        data: normalizedCart
      });
    } catch (error) {
      console.error('[ShopifyCartBridge] Failed to get cart:', error);
      sendResponse(event.source, event.origin, {
        id,
        success: false,
        error: error.message || 'Failed to get cart'
      });
    }
  }
  
  // Handle navigation to cart
  function handleNavigateToCart(event, id) {
    try {
      // Instead of navigating directly, send message to iframe to handle navigation
      sendResponse(event.source, event.origin, {
        id,
        success: true,
        type: 'NAVIGATE_TO_CART'
      });
    } catch (error) {
      console.error('[ShopifyCartBridge] Failed to handle navigate to cart:', error);
      sendResponse(event.source, event.origin, {
        id,
        success: false,
        error: error.message || 'Failed to handle navigate to cart'
      });
    }
  }

  // Handle navigation to checkout
  function handleNavigateToCheckout(event, id) {
    try {
      // Instead of navigating directly, send message to iframe to handle navigation
      sendResponse(event.source, event.origin, {
        id,
        success: true,
        type: 'NAVIGATE_TO_CHECKOUT'
      });
    } catch (error) {
      console.error('[ShopifyCartBridge] Failed to handle navigate to checkout:', error);
      sendResponse(event.source, event.origin, {
        id,
        success: false,
        error: error.message || 'Failed to handle navigate to checkout'
      });
    }
  }
  
  // Get cart helper
  async function getCart() {
    console.log('[ShopifyCartBridge] Fetching cart from /cart.js');
    const response = await fetch('/cart.js');
    console.log('[ShopifyCartBridge] Cart response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ShopifyCartBridge] Cart fetch error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const cart = await response.json();
    console.log('[ShopifyCartBridge] Cart data:', cart);
    return cart;
  }
  
  // Normalize cart data structure
  function normalizeCartData(cart) {
    return {
      items: Array.isArray(cart.items) ? cart.items.map(item => ({
        id: item.key?.toString() || item.id?.toString() || '',
        variantId: item.variant_id?.toString() || item.id?.toString() || '',
        quantity: item.quantity || 0,
        name: item.product_title || item.title || '',
        price: formatPrice(item.price || 0, cart.currency),
        image: item.image || (item.featured_image ? item.featured_image.url : '') || ''
      })) : [],
      total_price: cart.total_price || 0,
      item_count: cart.item_count || 0,
      currency: cart.currency || 'USD',
      token: cart.token || '',
      note: cart.note || '',
      attributes: cart.attributes || {}
    };
  }
  
  // Format price helper
  function formatPrice(price, currency = 'USD') {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(price / 100); // Shopify prices are in cents
    } catch (error) {
      return `$${(price / 100).toFixed(2)}`;
    }
  }
  
  // Send response
  function sendResponse(source, origin, data) {
    console.log('[ShopifyCartBridge] Sending response:', data);
    source.postMessage(data, origin);
  }
  
  // Notify that bridge is ready
  window.addEventListener('DOMContentLoaded', () => {
    console.log('[ShopifyCartBridge] Bridge ready, sending BRIDGE_READY message');
    window.parent.postMessage({ type: 'BRIDGE_READY' }, '*');
  });
})();