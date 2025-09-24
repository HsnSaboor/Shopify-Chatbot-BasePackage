( () => {
  "use strict";

  // THIS IS THE NEW PLACEHOLDER. A VALID EMPTY OBJECT WITH A COMMENT MARKER.
  const CONFIG = {}; /* __CONFIG_PLACEHOLDER__ */

  // Fix CONFIG handling: fallback if apiUrl or iframe.src is missing
  if (!CONFIG.apiUrl || !CONFIG.iframe?.src) {
    console.error('[TransparentChatbotEmbed] CONFIG missing apiUrl or iframe.src, using fallback');
    CONFIG.apiUrl = window.location.origin;
    CONFIG.iframe = CONFIG.iframe || {};
    CONFIG.iframe.src = '/chatbot?embedded=true';
  }

  const PARENT_STORAGE_KEY = "shopify_chatbot_parent_state";
  const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

  console.log('[TransparentChatbotEmbed] Initializing embed script');
  
  if (typeof window === 'undefined') {
    console.log('[TransparentChatbotEmbed] Not in browser environment, exiting');
    return;
  }
  
  const getShopifyFont = () => {
    const fontFamily = getComputedStyle(document.documentElement)
      .getPropertyValue('--font-body-family') || 
      '"Inter var", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';
    return fontFamily;
  };
  
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  }
  
  class TransparentIframeManager {
    constructor() {
      console.log('[TransparentChatbotEmbed] Creating TransparentIframeManager');
      this.iframe = null;
      this.container = null;
      this.cookieInterval = null;
    }
    
    mount() {
      console.log('[TransparentChatbotEmbed] Mounting iframe manager');
      this.createContainer();
      this.createIframe();
      this.addResponsiveStyles();
      this.applyCSSReset();
      this.setupMessageListener();
      
      this.extractAndSendCookies();
      this.cookieInterval = setInterval(() => this.extractAndSendCookies(), 5000);
      
      this.container.appendChild(this.iframe);
      document.body.appendChild(this.container);
      console.log('[TransparentChatbotEmbed] iframe mounted successfully');
      
      window.addEventListener('beforeunload', () => {
        if (this.cookieInterval) {
          clearInterval(this.cookieInterval);
        }
      });
    }
    
    createContainer() {
      console.log('[TransparentChatbotEmbed] Creating container');
      this.container = document.createElement('div');
      this.container.id = 'transparent-chatbot-container';

      // Set initial responsive container styles based on screen width
      const setInitialContainerStyles = () => {
        if (window.innerWidth >= 1024) {
          // Desktop: fixed bottom-right, 500x800
          this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            left: auto;
            top: auto;
            width: 500px;
            height: 800px;
            max-height: 800px;
            z-index: 999;
            pointer-events: none;
            background: transparent;
            margin: 0;
            padding: 0;
            box-sizing: border-box;`;
        } else if (window.innerWidth >= 768) {
          // Tablet: fixed bottom-right, 450x650
          this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            left: auto;
            top: auto;
            width: 450px;
            height: 650px;
            max-height: 650px;
            z-index: 999;
            pointer-events: none;
            background: transparent;
            margin: 0;
            padding: 0;
            box-sizing: border-box;`;
        } else {
          // Mobile: full viewport
          this.container.style.cssText = `
            position: fixed;
            bottom: 0;
            right: 0;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            z-index: 999;
            pointer-events: none;
            background: transparent;
            margin: 0;
            padding: 0;
            box-sizing: border-box;`;
        }
      };

      setInitialContainerStyles();
    }
    
    createIframe() {
      console.log('[TransparentChatbotEmbed] Creating iframe');
      this.iframe = document.createElement('iframe');
      this.iframe.id = 'transparent-chatbot-iframe';
      const baseSrc = CONFIG.apiUrl + CONFIG.iframe.src;
      let src = baseSrc;
      if (baseSrc.includes('?')) {
        src += '&respectClosed=true';
      } else {
        src += '?respectClosed=true';
      }
      this.iframe.src = src;
      
      // Add load/error logging
      this.iframe.onload = () => {
        console.log('[TransparentChatbotEmbed] Iframe loaded successfully');
        if (this.iframe.contentWindow) {
          this.iframe.contentWindow.postMessage({ type: 'EMBEDDED_CONFIRM', embedded: true }, '*');
        }
      };
      this.iframe.onerror = () => console.log('[TransparentChatbotEmbed] Iframe failed to load');
      
      this.iframe.style.cssText = `position: relative; width: 100vw; height: 100%; border: none; background: transparent; pointer-events: auto; margin: 0; padding: 0; box-sizing: border-box; border-radius: 0; z-index: 9999;`;
      this.iframe.setAttribute("allowTransparency", "true");
       
       // Set initial responsive dimensions for iframe only (container set in createContainer)
       const setInitialDimensions = () => {
         if (window.innerWidth >= 1024) {
           // lg: 500px w / 800px h
           this.iframe.style.width = '500px';
           this.iframe.style.height = '800px';
           this.iframe.style.maxHeight = '800px';
           this.iframe.style.borderRadius = '12px';
         } else if (window.innerWidth >= 768) {
           // md: 450px w / 650px h
           this.iframe.style.width = '450px';
           this.iframe.style.height = '650px';
           this.iframe.style.maxHeight = '650px';
           this.iframe.style.borderRadius = '12px';
         } else {
           // mobile: full viewport
           this.iframe.style.width = '100vw';
           this.iframe.style.height = '100vh';
           this.iframe.style.maxHeight = 'none';
           this.iframe.style.borderRadius = '0';
         }
       };
       setInitialDimensions();
       window.addEventListener('resize', setInitialDimensions);
     }
     
    addResponsiveStyles() {
      console.log('[TransparentChatbotEmbed] Adding responsive styles');
      const styleId = 'transparent-chatbot-responsive-styles';
      if (!document.getElementById(styleId)) {
        const styleTag = document.createElement('style');
        styleTag.id = styleId;
        styleTag.textContent = `
          @media (min-width: 1024px) {
            #transparent-chatbot-container {
              width: 500px !important;
              height: 800px !important;
              max-height: 800px !important;
              bottom: 20px !important;
              right: 20px !important;
              left: auto !important;
              top: auto !important;
            }
            #transparent-chatbot-iframe {
              width: 500px !important;
              height: 800px !important;
              max-height: 800px !important;
              min-width: 500px !important;
              max-width: 500px !important;
            }
          }
          @media (min-width: 768px) and (max-width: 1023px) {
            #transparent-chatbot-container {
              width: 450px !important;
              height: 650px !important;
              max-height: 650px !important;
              bottom: 20px !important;
              right: 20px !important;
              left: auto !important;
              top: auto !important;
            }
            #transparent-chatbot-iframe {
              width: 450px !important;
              height: 650px !important;
              max-height: 650px !important;
              min-width: 450px !important;
              max-width: 450px !important;
            }
          }
          @media (max-width: 767px) {
            #transparent-chatbot-container {
              bottom: 0 !important;
              right: 0 !important;
              left: 0 !important;
              top: 0 !important;
              width: 100dvw !important;
              height: 100dvh !important;
            }
            #transparent-chatbot-iframe {
              width: 100dvw !important;
              height: 100dvh !important;
              min-width: unset !important;
              max-width: none !important;
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
          #transparent-chatbot-container, #transparent-chatbot-container * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          #transparent-chatbot-iframe {
            background: transparent !important;
          }
          #transparent-chatbot-iframe body, #transparent-chatbot-iframe html {
            background: transparent !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
    
      injectCartPopupStyles() {
        if (document.getElementById('chatbot-cart-popup-styles')) {
          return;
        }
      
      const fontFamily = getShopifyFont();
      const style = document.createElement('style');
      style.id = 'chatbot-cart-popup-styles';
      style.textContent = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn95 { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .fixed { position: fixed; }
        .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
        .z-\\[99999\\] { z-index: 99999 !important; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .w-full { width: 100%; }
        .max-w-md { max-width: 28rem; }
        .mx-4 { margin-left: 1rem; margin-right: 1rem; }
        .bg-black\\/70 { background-color: rgba(0,0,0,0.7); }
        .backdrop-blur-sm { backdrop-filter: blur(4px); }
        .animate-in { animation-fill-mode: both; }
        .zoom-in-95 { animation-name: zoomIn95; }
        .duration-200 { animation-duration: 200ms; }

        .bg-white { background-color: #ffffff; }
        .rounded-2xl { border-radius: 1rem; }
        .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); }
        .overflow-hidden { overflow: hidden; }

        .text-center { text-align: center; }
        .pb-4 { padding-bottom: 1rem; }
        .pt-6 { padding-top: 1.5rem; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }

        .mx-auto { margin-left: auto; margin-right: auto; }
        .w-16 { width: 4rem; }
        .h-16 { height: 4rem; }
        .bg-green-100 { background-color: #dcfce7; }
        .rounded-full { border-radius: 9999px; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .mb-4 { margin-bottom: 1rem; }
        .text-green-600 { color: #16a34a; }
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .font-semibold { font-weight: 600; }
        .text-green-700 { color: #15803d; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-gray-600 { color: #4b5563; }

        .pb-6 { padding-bottom: 1.5rem; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .bg-gray-50 { background-color: #f9fafb; }
        .rounded-xl { border-radius: 0.75rem; }
        .p-4 { padding: 1rem; }
        .border { border-width: 1px; }
        .border-gray-200 { border-color: #e5e7eb; }
        .flex-col { flex-direction: column; }
        .items-start { align-items: flex-start; }
        .flex-wrap { flex-wrap: wrap; }
        .mb-3 { margin-bottom: 0.75rem; }
        .font-medium { font-weight: 500; }
        .font-bold { font-weight: 700; }
        .gap-2 { gap: 0.5rem; }
        .inline-flex { display: inline-flex; }
        .bg-blue-100 { background-color: #dbeafe; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .text-blue-800 { color: #1e40af; }
        .text-gray-900 { color: #111827; }
        .justify-between { justify-content: space-between; }
        .rounded-lg { border-radius: 0.5rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .transition-colors { transition: background-color 150ms cubic-bezier(.4,0,.2,1), color 150ms cubic-bezier(.4,0,.2,1); }
        .border-input { border-color: #e5e7eb; }
        .bg-background { background-color: #ffffff; }
        .hover\\:bg-accent:hover { background-color: #f3f4f6; }
        .hover\\:text-accent-foreground:hover { color: #111827; }
        .h-10 { height: 2.5rem; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .bg-blue-600 { background-color: #2563eb; }
        .text-white { color: #ffffff; }
        .hover\\:bg-blue-700:hover { background-color: #1d4ed8; }
        .ml-2 { margin-left: 0.5rem; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .flex-1 { flex: 1 1 0%; }
        .mr-2 { margin-right: 0.5rem; }
        .max-h-32 { max-height: 8rem; }
        .overflow-y-auto { overflow-y: auto; }
        .pr-2 { padding-right: 0.5rem; }
        .border-t { border-top-width: 1px; border-top-color: #e5e7eb; }
        .pt-3 { padding-top: 0.75rem; }
        .mt-3 { margin-top: 0.75rem; }
        .font-medium { font-weight: 500; }

        #chatbot-cart-popup { font-family: ${fontFamily}; }

        #chatbot-cart-popup button:focus,
        #chatbot-cart-popup button:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }
      `;
      document.head.appendChild(style);
    }
    
    formatPrice(price, currency) {
      const currencySymbols = {
        USD: "$",    // United States Dollar
        EUR: "€",    // Eurozone
        JPY: "¥",    // Japan
        GBP: "£",    // United Kingdom
        AUD: "A$",   // Australia
        CAD: "C$",   // Canada
        CHF: "CHF",  // Switzerland
        CNY: "¥",    // China (Renminbi)
        HKD: "HK$",  // Hong Kong
        NZD: "NZ$",  // New Zealand
        SEK: "kr",   // Sweden
        KRW: "₩",    // South Korea
        SGD: "S$",   // Singapore
        NOK: "kr",   // Norway
        MXN: "Mex$", // Mexico
        INR: "₹",    // India
        RUB: "₽",    // Russia
        ZAR: "R",    // South Africa
        TRY: "₺",    // Turkey
        BRL: "R$",   // Brazil
        TWD: "NT$",  // Taiwan
        DKK: "kr",   // Denmark
        PLN: "zł",   // Poland
        THB: "฿",    // Thailand
        IDR: "Rp",   // Indonesia
        HUF: "Ft",   // Hungary
        CZK: "Kč",   // Czech Republic
        ILS: "₪",    // Israel
        CLP: "CLP$", // Chile
        PHP: "₱",    // Philippines
        AED: "AED",  // United Arab Emirates
        COP: "COP$", // Colombia
        SAR: "SAR",  // Saudi Arabia
        MYR: "RM",   // Malaysia
        RON: "lei",  // Romania
        PKR: "₨",    // Pakistan
        VND: "₫",    // Vietnam
        EGP: "EGP",  // Egypt
        NGN: "₦",    // Nigeria
        KES: "KSh",  // Kenya
        ARS: "ARS$", // Argentina
        QAR: "QAR",  // Qatar
        KWD: "KWD",  // Kuwait
        BDT: "৳",    // Bangladesh
        LKR: "LKR",  // Sri Lanka
        MAD: "MAD",  // Morocco
        JOD: "JOD",  // Jordan
        OMR: "OMR",  // Oman
        BHD: "BHD",  // Bahrain
        UAH: "₴"     // Ukraine
      };
      try {
        const num = parseFloat(String(price)) / 100;
        if (isNaN(num)) {
          return "$ 0.00";
        }
        const upperCurrency = (currency || 'USD').toUpperCase();
        const symbol = currencySymbols[upperCurrency] || upperCurrency || '$';
        return `${symbol} ${num.toFixed(2)}`;
      } catch (error) {
        return "$ 0.00";
      }
    }

    showCartPopupInParent(cart) {
      this.injectCartPopupStyles();
      
      const existingPopup = document.getElementById('chatbot-cart-popup');
      if (existingPopup) existingPopup.remove();
      
      const popupContainer = document.createElement('div');
      popupContainer.id = 'chatbot-cart-popup';
      popupContainer.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[99999]';
      popupContainer.style.animation = 'fadeIn 0.2s ease-out';
      
      const popupContent = document.createElement('div');
      popupContent.className = 'w-full max-w-md mx-4';
      
      // Inner card HTML: removed per-item list; kept only item count + total price horizontally
      const innerContent = `
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
          <div class="text-center pb-4 pt-6 px-6">
            <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600" aria-hidden="true">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-green-700">Added to Cart!</h3>
            <p id="cart-countdown-text" class="text-sm text-gray-600">Closing in 5s</p>
          </div>

          <div class="px-6 pb-6 space-y-4">
            <!-- Cart Summary: only count + total price, horizontally aligned -->
            <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div class="flex items-center justify-center gap-4 mb-3">
                <span id="cart-items-count" class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">
                  ${cart.item_count} ${cart.item_count === 1 ? "item" : "items"}
                </span>
                <div id="cart-total-display" class="text-lg font-bold text-gray-900">
                  ${this.formatPrice(cart.total_price, cart.currency)}
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <button id="view-cart-btn" class="flex-1 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                View Cart
              </button>
              <button id="checkout-btn" class="flex-1 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
                Checkout
              </button>
            </div>

            <button id="close-popup-btn" class="w-full inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mt-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m18 6-12 12"></path>
                <path d="m6 6 12 12"></path>
              </svg>
              <span class="ml-2">Close</span>
            </button>
          </div>
        </div>
      `;
      
      popupContent.innerHTML = innerContent;
      popupContainer.appendChild(popupContent);
      document.body.appendChild(popupContainer);
      
      // Countdown logic (5s) and robust clearing
      let remaining = 5;
      const countdownEl = popupContainer.querySelector('#cart-countdown-text');
      let countdownInterval = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(countdownInterval);
          if (popupContainer.parentNode) popupContainer.parentNode.removeChild(popupContainer);
          return;
        }
        if (countdownEl) countdownEl.textContent = `Closing in ${remaining}s`;
      }, 1000);

      // Event listeners for buttons
      const viewCartBtn = popupContainer.querySelector('#view-cart-btn');
      const checkoutBtn = popupContainer.querySelector('#checkout-btn');
      const closeBtn = popupContainer.querySelector('#close-popup-btn');
      
      let isNavigating = false;
      
      const removePopupAndClear = () => {
        try {
          clearInterval(countdownInterval);
        } catch (e) {}
        if (popupContainer.parentNode) popupContainer.parentNode.removeChild(popupContainer);
      };

      if (viewCartBtn) {
        viewCartBtn.addEventListener('click', () => {
          if (isNavigating) return;
          isNavigating = true;
          removePopupAndClear();
          if (window.location.pathname === '/cart') {
            window.location.reload();
          } else {
            window.location.href = '/cart';
          }
        });
      }
      
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
          if (isNavigating) return;
          isNavigating = true;
          removePopupAndClear();
          if (window.location.pathname === '/checkout') {
            window.location.reload();
          } else {
            window.location.href = '/checkout';
          }
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          removePopupAndClear();
        });
      }

      // Click outside to close
      popupContainer.addEventListener('click', (e) => {
        if (e.target === popupContainer) {
          removePopupAndClear();
        }
      });
    }

    saveParentState(state) {
      try {
        if (typeof window === 'undefined' || !window.localStorage) {
          return;
        }
        const jsonString = JSON.stringify(state);
        localStorage.setItem(PARENT_STORAGE_KEY, jsonString);
        console.log('[TransparentChatbotEmbed] Saved parent chat state:', jsonString.length, 'bytes');
      } catch (error) {
        console.error('[TransparentChatbotEmbed] Failed to save parent chat state:', error);
      }
    }
  
    loadParentState() {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      try {
        const stored = localStorage.getItem(PARENT_STORAGE_KEY);
        if (!stored) return null;
  
        const parsed = JSON.parse(stored);
        console.log('[TransparentChatbotEmbed] Loaded parent state keys:', Object.keys(parsed));
  
        if (Date.now() - parsed.lastActivity > EXPIRY_TIME) {
          console.log('[TransparentChatbotEmbed] Parent state expired, clearing.');
          localStorage.removeItem(PARENT_STORAGE_KEY);
          return null;
        }
  
        // Basic validation
        if (!Array.isArray(parsed.messages)) {
          console.warn('[TransparentChatbotEmbed] Invalid messages array in parent state');
          return null;
        }
  
        // Simple message validation
        const validMessages = parsed.messages.filter(msg =>
          typeof msg === 'object' &&
          typeof msg.id === 'string' &&
          typeof msg.type === 'string' &&
          typeof msg.content === 'string' &&
          (typeof msg.timestamp === 'string' || msg.timestamp)
        );
  
        if (validMessages.length !== parsed.messages.length) {
          console.warn('[TransparentChatbotEmbed] Invalid messages in parent state, resetting messages');
          parsed.messages = [];
        } else {
          parsed.messages = validMessages;
        }
  
        const state = {
          messages: parsed.messages,
          isOpen: typeof parsed.isOpen === 'boolean' ? parsed.isOpen : false,
          lastActivity: typeof parsed.lastActivity === 'number' ? parsed.lastActivity : Date.now(),
          manuallyClosed: typeof parsed.manuallyClosed === 'boolean' ? parsed.manuallyClosed : false,
        };
  
        console.log('[TransparentChatbotEmbed] Valid parent state loaded: isOpen:', state.isOpen, 'Messages:', state.messages.length);
        return state;
      } catch (error) {
        console.warn('[TransparentChatbotEmbed] Failed to parse parent chat state:', error);
        return null;
      }
    }
  
    setupMessageListener() {
      const isAllowedOrigin = (origin) => {
        if (!origin || origin === 'null') return false;
        if (origin === window.location.origin) return true;
        
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
        
        if (origin.includes('.myshopify.com')) return true;
        
        try {
          const apiOrigin = new URL(CONFIG.apiUrl).origin;
          if (origin === apiOrigin) return true;
        } catch (e) {
        }
        
        if (origin.includes('.shopify.com')) return true;
        
        return false;
      };
  
      let navigationInProgress = false;
  
      window.addEventListener('message', (event) => {
        if (!event.origin || event.origin === 'null') return;
        if (!isAllowedOrigin(event.origin)) {
          console.warn('[TransparentChatbotEmbed] Message from unauthorized origin:', event.origin);
          return;
        }
  
        const { type, success, cart, state: stateData } = event.data;
  
        // Handle chat state messages
        if (type === 'CHAT_STATE_REQUEST') {
          const parentState = this.loadParentState();
          this.iframe.contentWindow.postMessage({
            type: 'CHAT_STATE_RESPONSE',
            state: parentState ? JSON.stringify(parentState) : null
          }, event.origin);
          return;
        }
  
        if (type === 'CHAT_STATE_SAVE') {
          if (stateData) {
            const saveState = { ...stateData, lastActivity: Date.now() };
            this.saveParentState(saveState);
          }
          return;
        }
  
        if (type === 'CHAT_STATE_CLEAR') {
          localStorage.removeItem(PARENT_STORAGE_KEY);
          return;
        }
  
        if (type === 'SHOW_CART_POPUP') {
          this.showCartPopupInParent(event.data.cart);
          return;
        }
  
        if (success && (type === 'NAVIGATE_TO_CART' || type === 'NAVIGATE_TO_CHECKOUT')) {
          if (navigationInProgress) return;
          navigationInProgress = true;
          const targetPath = type === 'NAVIGATE_TO_CART' ? '/cart' : '/checkout';
          if (window.location.pathname === targetPath) {
            window.location.reload();
          } else {
            window.location.href = targetPath;
          }
          setTimeout(() => { navigationInProgress = false; }, 1000);
          return;
        }
      });
    }

    extractAndSendCookies() {
      const shopify_y = getCookie('_shopify_y') || '';
      const cart_currency = getCookie('cart_currency') || 'USD';
      const localization = getCookie('localization') || 'US';

      const cookies = {
        shopify_y,
        cart_currency,
        localization,
      };

      if (this.iframe && this.iframe.contentWindow) {
        this.iframe.contentWindow.postMessage({
          type: 'SHOPIFY_COOKIES_UPDATE',
          data: cookies
        }, '*');
      }
    }

  }
  const manager = new TransparentIframeManager();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => manager.mount());
  } else {
    manager.mount();
  }
})();