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
        
        // Only process messages from the iframe
        if (event.source !== this.iframe.contentWindow) {
          return;
        }
        
        const { type, success } = event.data;
        
        // Handle navigation messages from the cart bridge
        if (success && type === 'NAVIGATE_TO_CART') {
          logWithRateLimit('Navigation', 'Navigating to cart in parent window');
          window.top.location.href = '/cart';
          return;
        }
        
        if (success && type === 'NAVIGATE_TO_CHECKOUT') {
          logWithRateLimit('Navigation', 'Navigating to checkout in parent window');
          window.top.location.href = '/checkout';
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