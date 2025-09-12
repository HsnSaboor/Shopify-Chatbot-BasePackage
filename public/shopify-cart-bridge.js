/**
 * Minimal Shopify Cart Bridge Script
 * This script runs on the Shopify store domain and handles cart operations
 * through postMessage communication with the chatbot iframe.
 */

(() => {
  'use strict';
  
  const CONFIG = {
    allowedOrigins: [
      'https://shopify-ai-chatbot-v2.vercel.app',
      'http://localhost:3000'
    ]
  };
  
  // Handle incoming messages
  window.addEventListener('message', (event) => {
    console.log('[ShopifyCartBridge] Received message:', event.data);
    
    // Validate origin
    if (!CONFIG.allowedOrigins.includes(event.origin)) {
      console.warn('[ShopifyCartBridge] Invalid origin:', event.origin);
      return;
    }
    
    const { type, payload, id } = event.data;
    console.log('[ShopifyCartBridge] Processing message:', { type, payload, id });
    
    switch (type) {
      case 'CART_ADD_ITEM':
        handleAddToCart(event, payload, id);
        break;
      case 'CART_GET':
        handleGetCart(event, id);
        break;
      default:
        console.warn('[ShopifyCartBridge] Unknown message type:', type);
        sendResponse(event.source, event.origin, {
          id,
          success: false,
          error: 'Unknown message type'
        });
    }
  });
  
  // Handle add to cart
  async function handleAddToCart(event, payload, id) {
    try {
      console.log('[ShopifyCartBridge] Adding item to cart:', payload);
      
      const formData = {
        items: [{
          id: payload.variantId,
          quantity: payload.quantity
        }]
      };
      
      console.log('[ShopifyCartBridge] Sending request to /cart/add.js with data:', formData);
      
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      console.log('[ShopifyCartBridge] Add to cart response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ShopifyCartBridge] Add to cart error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[ShopifyCartBridge] Add to cart result:', result);
      
      const cart = await getCart();
      console.log('[ShopifyCartBridge] Updated cart:', cart);
      
      sendResponse(event.source, event.origin, {
        id,
        success: true,
        data: { result, cart }
      });
    } catch (error) {
      console.error('[ShopifyCartBridge] Failed to add to cart:', error);
      sendResponse(event.source, event.origin, {
        id,
        success: false,
        error: error.message
      });
    }
  }
  
  // Handle get cart
  async function handleGetCart(event, id) {
    try {
      console.log('[ShopifyCartBridge] Getting cart');
      const cart = await getCart();
      console.log('[ShopifyCartBridge] Cart retrieved:', cart);
      sendResponse(event.source, event.origin, {
        id,
        success: true,
        data: cart
      });
    } catch (error) {
      console.error('[ShopifyCartBridge] Failed to get cart:', error);
      sendResponse(event.source, event.origin, {
        id,
        success: false,
        error: error.message
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