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
    // Validate origin
    if (!CONFIG.allowedOrigins.includes(event.origin)) return;
    
    const { type, payload, id } = event.data;
    
    switch (type) {
      case 'CART_ADD_ITEM':
        handleAddToCart(event, payload, id);
        break;
      case 'CART_GET':
        handleGetCart(event, id);
        break;
      default:
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
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: payload.variantId, quantity: payload.quantity }] })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      const cart = await getCart();
      
      sendResponse(event.source, event.origin, {
        id,
        success: true,
        data: { result, cart }
      });
    } catch (error) {
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
      const cart = await getCart();
      sendResponse(event.source, event.origin, {
        id,
        success: true,
        data: cart
      });
    } catch (error) {
      sendResponse(event.source, event.origin, {
        id,
        success: false,
        error: error.message
      });
    }
  }
  
  // Get cart helper
  async function getCart() {
    const response = await fetch('/cart.js');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }
  
  // Send response
  function sendResponse(source, origin, data) {
    source.postMessage(data, origin);
  }
  
  // Notify that bridge is ready
  window.addEventListener('DOMContentLoaded', () => {
    window.parent.postMessage({ type: 'BRIDGE_READY' }, '*');
  });
})();