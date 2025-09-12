/**
 * Minimal Transparent Chatbot Embed Script
 * Creates iframe with transparent styling and handles message routing
 */

(() => {
  "use strict";
  
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
  
  class TransparentIframeManager {
    constructor() {
      this.iframe = null;
      this.container = null;
    }
    
    mount() {
      this.createContainer();
      this.createIframe();
      this.addResponsiveStyles();
      this.applyCSSReset();
      
      this.container.appendChild(this.iframe);
      document.body.appendChild(this.container);
    }
    
    createContainer() {
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
  }
  
  // Initialize when ready
  function initialize() {
    const manager = new TransparentIframeManager();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => manager.mount());
    } else {
      manager.mount();
    }
  }
  
  initialize();
})();