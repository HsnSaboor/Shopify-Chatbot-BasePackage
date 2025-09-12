/**
 * Minimal Transparent Chatbot Embed Script
 * Creates iframe with transparent styling and handles message routing
 */

(() => {
  "use strict";
  
  console.log('[TransparentChatbotEmbed] Initializing embed script');
  
  // Only run in browser environment
  if (typeof window === 'undefined') {
    console.log('[TransparentChatbotEmbed] Not in browser environment, exiting');
    return;
  }
  
  const CONFIG = {
    apiUrl: window.CHATBOT_API_URL || "https://shopify-ai-chatbot-v2.vercel.app",
    iframe: {
      src: "/chatbot?embedded=true",
      dimensions: {
        pc: {
          width: "500px",
          minWidth: "500px",
          maxWidth: "500px",
          height: "800px",
          containerWidth: "520px"
        },
        mobile: {
          width: "100vw",
          height: "100vh",
          maxWidth: "100vw",
          maxHeight: "100vh"
        }
      }
    },
    responsive: {
      mobileBreakpoint: 768,
      desktopBreakpoint: 769
    }
  };
  
  console.log('[TransparentChatbotEmbed] Configuration:', CONFIG);
  
  class TransparentIframeManager {
    constructor() {
      console.log('[TransparentChatbotEmbed] Creating TransparentIframeManager');
      this.iframe = null;
      this.container = null;
    }
    
    mount() {
      console.log('[TransparentChatbotEmbed] Mounting iframe manager');
      this.createContainer();
      this.createIframe();
      this.addResponsiveStyles();
      this.applyCSSReset();
      this.setupMessageListener();
      
      this.container.appendChild(this.iframe);
      document.body.appendChild(this.container);
      console.log('[TransparentChatbotEmbed] iframe mounted successfully');
    }
    
    createContainer() {
      console.log('[TransparentChatbotEmbed] Creating container');
      this.container = document.createElement('div');
      this.container.id = 'transparent-chatbot-container';
      this.container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: ${CONFIG.iframe.dimensions.pc.containerWidth};
        z-index: 9999;
        pointer-events: none;
        background: transparent;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      `;
    }
    
    createIframe() {
      console.log('[TransparentChatbotEmbed] Creating iframe');
      this.iframe = document.createElement('iframe');
      this.iframe.id = 'transparent-chatbot-iframe';
      this.iframe.src = `${CONFIG.apiUrl}${CONFIG.iframe.src}`;
      
      this.iframe.style.cssText = `
        position: relative;
        width: ${CONFIG.iframe.dimensions.pc.width};
        min-width: ${CONFIG.iframe.dimensions.pc.minWidth};
        max-width: ${CONFIG.iframe.dimensions.pc.maxWidth};
        height: ${CONFIG.iframe.dimensions.pc.height};
        max-height: 100vh;
        border: none;
        background: transparent;
        pointer-events: auto;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        border-radius: 12px;
        overflow: hidden;
        z-index: 99999;
      `;
      
      this.iframe.setAttribute("allowTransparency", "true");
    }
    
    addResponsiveStyles() {
      console.log('[TransparentChatbotEmbed] Adding responsive styles');
      const styleId = 'transparent-chatbot-responsive-styles';
      if (!document.getElementById(styleId)) {
        const styleTag = document.createElement('style');
        styleTag.id = styleId;
        styleTag.textContent = `
          @media (min-width: ${CONFIG.responsive.desktopBreakpoint}px) {
            #transparent-chatbot-container {
              width: ${CONFIG.iframe.dimensions.pc.containerWidth} !important;
            }
            
            #transparent-chatbot-iframe {
              width: ${CONFIG.iframe.dimensions.pc.width} !important;
              min-width: ${CONFIG.iframe.dimensions.pc.minWidth} !important;
              max-width: ${CONFIG.iframe.dimensions.pc.maxWidth} !important;
            }
          }
          
          @media (max-width: ${CONFIG.responsive.mobileBreakpoint}px) {
            #transparent-chatbot-container {
              bottom: 0 !important;
              right: 0 !important;
              left: 0 !important;
              top: 0 !important;
              width: ${CONFIG.iframe.dimensions.mobile.width} !important;
              height: ${CONFIG.iframe.dimensions.mobile.height} !important;
            }
            
            #transparent-chatbot-iframe {
              width: ${CONFIG.iframe.dimensions.mobile.width} !important;
              height: ${CONFIG.iframe.dimensions.mobile.height} !important;
              min-width: unset !important;
              max-width: ${CONFIG.iframe.dimensions.mobile.maxWidth} !important;
              max-height: ${CONFIG.iframe.dimensions.mobile.maxHeight} !important;
              border-radius: 0 !important;
            }
          }
        `;
        document.head.appendChild(styleTag);
      }
    }
    
    applyCSSReset() {
      console.log('[TransparentChatbotEmbed] Applying CSS reset');
      if (!document.getElementById('transparent-chatbot-css-reset')) {
        const style = document.createElement('style');
        style.id = 'transparent-chatbot-css-reset';
        style.textContent = `
          #transparent-chatbot-container,
          #transparent-chatbot-container * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          #transparent-chatbot-iframe {
            background: transparent !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    // Function to create and display cart popup in parent window
    showCartPopupInParent(cart) {
      // Remove any existing popup
      const existingPopup = document.getElementById('chatbot-cart-popup');
      if (existingPopup) {
        existingPopup.remove();
      }
      
      // Create popup container
      const popupContainer = document.createElement('div');
      popupContainer.id = 'chatbot-cart-popup';
      popupContainer.style.cssText = `
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        animation: fadeIn 0.2s ease-out;
      `;
      
      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.style.cssText = `
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        max-width: 24rem;
        width: 90%;
        margin: 1rem;
        animation: slideIn 0.2s ease-out;
      `;
      
      // Add popup HTML content (simplified for example)
      popupContent.innerHTML = this.createCartPopupHTML(cart);
      
      popupContainer.appendChild(popupContent);
      document.body.appendChild(popupContainer);
      
      // Add event listeners for buttons
      const viewCartBtn = popupContainer.querySelector('#view-cart-btn');
      const checkoutBtn = popupContainer.querySelector('#checkout-btn');
      const closeBtn = popupContainer.querySelector('#close-popup-btn');
      
      if (viewCartBtn) {
        viewCartBtn.addEventListener('click', () => {
          // Send message to navigate to cart
          window.postMessage({ type: 'NAVIGATE_TO_CART' }, window.location.origin);
          popupContainer.remove();
        });
      }
      
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
          // Send message to navigate to checkout
          window.postMessage({ type: 'NAVIGATE_TO_CHECKOUT' }, window.location.origin);
          popupContainer.remove();
        });
      }
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          popupContainer.remove();
        });
      }
      
      // Add auto-close functionality
      setTimeout(() => {
        if (popupContainer.parentNode) {
          popupContainer.parentNode.removeChild(popupContainer);
        }
      }, 5000); // Auto-close after 5 seconds
      
      // Close when clicking outside
      popupContainer.addEventListener('click', (e) => {
        if (e.target === popupContainer) {
          popupContainer.remove();
        }
      });
    }
    
    // Function to create cart popup HTML
    createCartPopupHTML(cart) {
      // Format cart items
      const cartItemsHTML = cart.items && Array.isArray(cart.items) && cart.items.length > 0 
        ? cart.items.slice(0, 3).map((item) => `
          <div class="flex justify-between text-sm">
            <span class="truncate flex-1 mr-2">${item.name}</span>
            <span class="font-medium">${item.price}</span>
          </div>
        `).join('') + (cart.items.length > 3 ? `<p class="text-xs text-gray-500">+${cart.items.length - 3} more items</p>` : '')
        : '<p class="text-xs text-gray-500">No items in cart</p>';

      return `
        <div class="w-full max-w-md mx-4">
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="text-center pb-4 pt-6 px-6">
              <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-green-700">Added to Cart!</h3>
              <p class="text-sm text-gray-600">Auto-closing in 5 seconds</p>
            </div>

            <div class="px-6 pb-6 space-y-4">
              <!-- Cart Summary -->
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="8" cy="21" r="1" />
                      <circle cx="19" cy="21" r="1" />
                      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L23 6H6" />
                    </svg>
                    Cart Summary
                  </h4>
                  <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    ${cart.item_count} ${cart.item_count === 1 ? "item" : "items"}
                  </span>
                </div>

                <div class="space-y-2 max-h-32 overflow-y-auto">
                  ${cartItemsHTML}
                </div>

                <div class="border-t pt-2 mt-3">
                  <div class="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>$${(cart.total_price / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3">
                <button id="view-cart-btn" class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  View Cart
                </button>
                <button id="checkout-btn" class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
                  Checkout
                </button>
              </div>

              <button id="close-popup-btn" class="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m18 6-12 12" />
                  <path d="m6 6 12 12" />
                </svg>
                <span class="ml-2">Close</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    // Add message listener for navigation messages from the cart bridge
    setupMessageListener() {
      console.log('[TransparentChatbotEmbed] Setting up message listener');
      
      // Add rate limiting for console logs
      const LOG_RATE_LIMIT = 1000; // 1 second
      const lastLogTimes = {};
      
      const logWithRateLimit = (context, message, ...args) => {
        const now = Date.now();
        const lastLog = lastLogTimes[context] || 0;
        
        if (now - lastLog >= LOG_RATE_LIMIT) {
          console.log(`[TransparentChatbotEmbed][${context}] ${message}`, ...args);
          lastLogTimes[context] = now;
        }
      };
      
      // Enhanced origin validation
      const isAllowedOrigin = (origin) => {
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
      };
      
      window.addEventListener('message', (event) => {
        // Skip processing if no origin or invalid origin
        if (!event.origin || event.origin === 'null') {
          return;
        }
        
        // Validate origin before processing
        if (!isAllowedOrigin(event.origin)) {
          logWithRateLimit('Security', 'Invalid origin:', event.origin);
          return;
        }
        
        // Process all messages, not just from iframe
        const { type, success, cart } = event.data;
        
        // Handle SHOW_CART_POPUP message
        if (type === 'SHOW_CART_POPUP') {
          logWithRateLimit('Popup', 'Showing cart popup in parent window');
          this.showCartPopupInParent(event.data.cart);
          return;
        }
        
        // Handle navigation messages from the cart bridge
        if (success && type === 'NAVIGATE_TO_CART') {
          logWithRateLimit('Navigation', 'Navigating to cart in parent window');
          // Use dynamic store URL instead of hardcoded URLs
          const storeUrl = window.location.origin;
          window.top.location.href = storeUrl + '/cart';
          return;
        }
        
        if (success && type === 'NAVIGATE_TO_CHECKOUT') {
          logWithRateLimit('Navigation', 'Navigating to checkout in parent window');
          // Use dynamic store URL instead of hardcoded URLs
          const storeUrl = window.location.origin;
          window.top.location.href = storeUrl + '/checkout';
          return;
        }
        
        // Also handle messages from the iframe
        if (event.source === this.iframe.contentWindow) {
          // Existing iframe message handling can go here if needed
        }
      });
    }
  }
  
  // Initialize when ready
  function initialize() {
    console.log('[TransparentChatbotEmbed] Initializing chatbot');
    const manager = new TransparentIframeManager();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => manager.mount());
    } else {
      manager.mount();
    }
  }
  
  initialize();
})();