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
  
  // Detect Shopify store font or use system font stack
  const getShopifyFont = () => {
    // Check for Shopify's font variables
    const fontFamily = getComputedStyle(document.documentElement)
      .getPropertyValue('--font-body-family') || 
      '"Inter var", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';
    return fontFamily;
  };
  
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
    
    // Function to inject required CSS styles for cart popup
    injectCartPopupStyles() {
      // Check if styles are already injected
      if (document.getElementById('chatbot-cart-popup-styles')) {
        return;
      }
      
      // Detect Shopify font or use system font stack
      const fontFamily = getShopifyFont();
      
      const style = document.createElement('style');
      style.id = 'chatbot-cart-popup-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes zoomIn95 {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .fixed {
          position: fixed;
        }
        
        .inset-0 {
          top: 0px;
          right: 0px;
          bottom: 0px;
          left: 0px;
        }
        
        .z-\[10000\] {
          z-index: 10000;
        }
        
        .flex {
          display: flex;
        }
        
        .items-center {
          align-items: center;
        }
        
        .justify-center {
          justify-content: center;
        }
        
        .w-full {
          width: 100%;
        }
        
        .max-w-md {
          max-width: 28rem;
        }
        
        .mx-4 {
          margin-left: 1rem;
          margin-right: 1rem;
        }
        
        .bg-black\/50 {
          background-color: rgba(0, 0, 0, 0.5);
        }
        
        .backdrop-blur-sm {
          backdrop-filter: blur(4px);
        }
        
        .animate-in {
          animation-duration: 200ms;
          animation-fill-mode: both;
        }
        
        .zoom-in-95 {
          animation-name: zoomIn95;
        }
        
        .duration-200 {
          animation-duration: 200ms;
        }
        
        .bg-white {
          background-color: #ffffff;
        }
        
        .rounded-xl {
          border-radius: 0.75rem;
        }
        
        .shadow-lg {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .overflow-hidden {
          overflow: hidden;
        }
        
        .text-center {
          text-align: center;
        }
        
        .pb-4 {
          padding-bottom: 1rem;
        }
        
        .pt-6 {
          padding-top: 1.5rem;
        }
        
        .px-6 {
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }
        
        .mx-auto {
          margin-left: auto;
          margin-right: auto;
        }
        
        .w-16 {
          width: 4rem;
        }
        
        .h-16 {
          height: 4rem;
        }
        
        .bg-green-100 {
          background-color: #dcfce7;
        }
        
        .rounded-full {
          border-radius: 9999px;
        }
        
        .mb-4 {
          margin-bottom: 1rem;
        }
        
        .text-green-600 {
          color: #16a34a;
        }
        
        .text-xl {
          font-size: 1.25rem;
          line-height: 1.75rem;
        }
        
        .font-semibold {
          font-weight: 600;
        }
        
        .text-green-700 {
          color: #15803d;
        }
        
        .text-sm {
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        
        .text-gray-600 {
          color: #4b5563;
        }
        
        .pb-6 {
          padding-bottom: 1.5rem;
        }
        
        .gap-3 {
          gap: 0.75rem;
        }
        
        .bg-gray-50 {
          background-color: #f9fafb;
        }
        
        .rounded-lg {
          border-radius: 0.5rem;
        }
        
        .p-4 {
          padding: 1rem;
        }
        
        .flex-col {
          flex-direction: column;
        }
        
        .items-start {
          align-items: flex-start;
        }
        
        .flex-wrap {
          flex-wrap: wrap;
        }
        
        .mb-3 {
          margin-bottom: 0.75rem;
        }
        
        .font-medium {
          font-weight: 500;
        }
        
        .gap-2 {
          gap: 0.5rem;
        }
        
        .inline-flex {
          display: inline-flex;
        }
        
        .items-center {
          align-items: center;
        }
        
        .rounded-full {
          border-radius: 9999px;
        }
        
        .bg-gray-100 {
          background-color: #f3f4f6;
        }
        
        .px-3 {
          padding-left: 0.75rem;
          padding-right: 0.75rem;
        }
        
        .py-1 {
          padding-top: 0.25rem;
          padding-bottom: 0.25rem;
        }
        
        .text-xs {
          font-size: 0.75rem;
          line-height: 1rem;
        }
        
        .text-gray-800 {
          color: #1f2937;
        }
        
        .justify-between {
          justify-content: space-between;
        }
        
        .flex {
          display: flex;
        }
        
        .rounded-md {
          border-radius: 0.375rem;
        }
        
        .text-sm {
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        
        .transition-colors {
          transition-property: background-color, border-color, color, fill, stroke;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
        
        .border {
          border-width: 1px;
        }
        
        .border-input {
          border-color: #e5e7eb;
        }
        
        .bg-background {
          background-color: #ffffff;
        }
        
        .hover\:bg-accent:hover {
          background-color: #f3f4f6;
        }
        
        .hover\:text-accent-foreground:hover {
          color: #111827;
        }
        
        .h-10 {
          height: 2.5rem;
        }
        
        .px-4 {
          padding-left: 1rem;
          padding-right: 1rem;
        }
        
        .py-2 {
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
        }
        
        .bg-blue-600 {
          background-color: #2563eb;
        }
        
        .text-white {
          color: #ffffff;
        }
        
        .hover\:bg-blue-700:hover {
          background-color: #1d4ed8;
        }
        
        .ml-2 {
          margin-left: 0.5rem;
        }
        
        #chatbot-cart-popup {
          font-family: ${fontFamily};
        }
        
        #chatbot-cart-popup button:focus,
        #chatbot-cart-popup button:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Helper method to format prices
    formatPrice(price, currency) {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency || 'USD'
        }).format(price / 100);
      } catch (error) {
        // Fallback formatting
        return `$${(price / 100).toFixed(2)}`;
      }
    }
    
    // Function to create and display cart popup in parent window
    showCartPopupInParent(cart) {
      // Inject required CSS styles
      this.injectCartPopupStyles();
      
      // Remove any existing popup
      const existingPopup = document.getElementById('chatbot-cart-popup');
      if (existingPopup) {
        existingPopup.remove();
      }
      
      // Create popup container with CSS classes
      const popupContainer = document.createElement('div');
      popupContainer.id = 'chatbot-cart-popup';
      popupContainer.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]';
      popupContainer.style.animation = 'fadeIn 0.2s ease-out';
      
      // Create popup content with CSS classes
      const popupContent = document.createElement('div');
      popupContent.className = 'w-full max-w-md mx-4';
      
      // Create the inner content with proper classes - simplified to show only count and price
      const innerContent = `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
          <div class="text-center pb-4 pt-6 px-6">
            <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-green-700">Added to Cart!</h3>
            <p class="text-sm text-gray-600">Auto-closing in 5 seconds</p>
          </div>

          <div class="px-6 pb-6">
            <!-- Simplified Cart Summary - only showing count and price -->
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Cart Total</p>
                  <p class="text-xl font-semibold text-gray-900">${this.formatPrice(cart.total_price, cart.currency)}</p>
                </div>
                <span class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                  ${cart.item_count} ${cart.item_count === 1 ? "item" : "items"}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 mt-4">
              <button id="view-cart-btn" class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                View Cart
              </button>
              <button id="checkout-btn" class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
                Checkout
              </button>
            </div>

            <button id="close-popup-btn" class="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mt-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m18 6-12 12" />
                <path d="m6 6 12 12" />
              </svg>
              <span class="ml-2">Close</span>
            </button>
          </div>
        </div>
      `;
      
      popupContent.innerHTML = innerContent;
      popupContainer.appendChild(popupContent);
      document.body.appendChild(popupContainer);
      
      // Add event listeners for buttons
      const viewCartBtn = popupContainer.querySelector('#view-cart-btn');
      const checkoutBtn = popupContainer.querySelector('#checkout-btn');
      const closeBtn = popupContainer.querySelector('#close-popup-btn');
      
      // Flag to prevent multiple clicks
      let isNavigating = false;
      
      if (viewCartBtn) {
        viewCartBtn.addEventListener('click', () => {
          if (isNavigating) return;
          isNavigating = true;
          
          // Remove popup immediately
          popupContainer.remove();
          
          // Check if already on cart page
          if (window.location.pathname === '/cart') {
            // Just reload the page
            window.location.reload();
          } else {
            // Navigate to cart page
            window.location.href = '/cart';
          }
        });
      }
      
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
          if (isNavigating) return;
          isNavigating = true;
          
          // Remove popup immediately
          popupContainer.remove();
          
          // Check if already on checkout page
          if (window.location.pathname === '/checkout') {
            // Just reload the page
            window.location.reload();
          } else {
.
            // Navigate to checkout page
            window.location.href = '/checkout';
          }
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
    
    // Add message listener for navigation messages from the cart bridge
    setupMessageListener() {
      
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
      
      // Debounce flag for navigation events
      let navigationInProgress = false;
      
      window.addEventListener('message', (event) => {
        // Skip processing if no origin or invalid origin
        if (!event.origin || event.origin === 'null') {
          return;
        }
        
        // Validate origin before processing
        if (!isAllowedOrigin(event.origin)) {
          return;
        }
        
        // Process all messages, not just from iframe
        const { type, success, cart } = event.data;
        
        // Handle SHOW_CART_POPUP message
        if (type === 'SHOW_CART_POPUP') {
          this.showCartPopupInParent(event.data.cart);
          return;
        }
        
        // Handle navigation messages from the cart bridge with debounce
        if (success && (type === 'NAVIGATE_TO_CART' || type === 'NAVIGATE_TO_CHECKOUT')) {
          if (navigationInProgress) {
            return;
          }
          
          navigationInProgress = true;
          
          const targetPath = type === 'NAVIGATE_TO_CART' ? '/cart' : '/checkout';
          
          // Check if already on target page
          if (window.location.pathname === targetPath) {
            // Just reload the page
            window.location.reload();
          } else {
            // Navigate to target page
            window.location.href = targetPath;
          }
          
          // Reset navigation flag after a delay
          setTimeout(() => {
            navigationInProgress = false;
          }, 1000);
          
          return;
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
