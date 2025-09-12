;(() => {
  "use strict";

  const urlParams = new URLSearchParams(window.location.search);
  const shopDomain = urlParams.get("shopDomain");

  // Configuration
  const CHATBOT_CONFIG = {
    apiUrl: window.CHATBOT_API_URL || "https://shopify-ai-chatbot-v2.vercel.app",
    storeUrl: shopDomain ? `https://${shopDomain}` : window.location.origin,
    iframe: {
      src: "/chatbot?embedded=true",
      dimensions: {
        pc: {
          width: "500px",
          minWidth: "500px", // PC minimum width requirement
          maxWidth: "500px",
          height: "800px",
          containerWidth: "520px"
        },
        mobile: {
          width: "100vw", // 100% of screen width
          height: "100vh", // 100% of screen height
          maxWidth: "100vw",
          maxHeight: "100vh"
        }
      },
      style: {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        border: "none",
        background: "transparent",
        zIndex: "9999",
        pointerEvents: "none"
      }
    },
    responsive: {
      mobileBreakpoint: 768,
      desktopBreakpoint: 769
    },
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
      }
    },
    stateKey: "shopify_chatbot_state",
    debug: false
  };

  console.log("[Chatbot] Detected store URL:", CHATBOT_CONFIG.storeUrl);

  // Utility functions
  function log(...args) {
    if (CHATBOT_CONFIG.debug) {
      console.log("[Transparent Chatbot]", ...args);
    }
  }

  function getCookie(name) {
    const value = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return value ? value.pop() : null;
  }

  function getCurrentPageData() {
    return {
      url: window.location.href,
      pathname: window.location.pathname,
      pageType: window.SHOPIFY_MINIMAL_DATA?.pageType || "unknown",
      handle: window.SHOPIFY_MINIMAL_DATA?.pageHandle || ""
    };
  }

  // === 1. MINIMAL DATA EXTRACTOR ===
  class DataExtractor {
    static extractShopifyData() {
      // Use provided minimal data or extract from cookies
      if (window.SHOPIFY_MINIMAL_DATA) {
        return {
          ...window.SHOPIFY_MINIMAL_DATA,
          currentPage: getCurrentPageData()
        };
      }

      return {
        customerId: getCookie('_shopify_y') || null,
        localization: "en",
        cartCurrency: "USD",
        currentPage: getCurrentPageData()
      };
    }

    static validateData(data) {
      return {
        isValid: data && typeof data === 'object',
        data: data || {}
      };
    }
  }

  // === 2. TRANSPARENT IFRAME MANAGER ===
class TransparentIframeManager {
  constructor() {
    this.iframe = null;
    this.container = null;
    this.isCreated = false;
  }

  createContainer() {
    if (this.container) return this.container;

    this.container = document.createElement('div');
    this.container.id = 'transparent-chatbot-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: ${CHATBOT_CONFIG.iframe.dimensions.pc.containerWidth}; /* PC container width for 500px iframe */
      z-index: ${CHATBOT_CONFIG.iframe.style.zIndex};
      pointer-events: none; /* container doesn’t block clicks */
      background: transparent;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    `;

    return this.container;
  }

  createIframe() {
    if (this.iframe) return this.iframe;

    this.iframe = document.createElement('iframe');
    this.iframe.id = 'transparent-chatbot-iframe';

    // Data
    const shopifyData = DataExtractor.extractShopifyData();
    const src = `${CHATBOT_CONFIG.apiUrl}${CHATBOT_CONFIG.iframe.src}&shopifyData=${encodeURIComponent(JSON.stringify(shopifyData))}`;
    this.iframe.src = src;

    // Enhanced iframe styling with explicit width control
    this.iframe.style.cssText = `
      position: relative;
      width: ${CHATBOT_CONFIG.iframe.dimensions.pc.width}; /* PC width */
      min-width: ${CHATBOT_CONFIG.iframe.dimensions.pc.minWidth}; /* PC minimum width requirement */
      max-width: ${CHATBOT_CONFIG.iframe.dimensions.pc.maxWidth};
      height: ${CHATBOT_CONFIG.iframe.dimensions.pc.height};
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

    // Allow transparency in browsers
    this.iframe.setAttribute("allowTransparency", "true");

    // Enhanced responsive styling
    this.addResponsiveStyles();

    return this.iframe;
  }

  addResponsiveStyles() {
    const styleId = 'transparent-chatbot-responsive-styles';
    
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.textContent = `
        /* PC styles - ensure minimum 500px width */
        @media (min-width: ${CHATBOT_CONFIG.responsive.desktopBreakpoint}px) {
          #transparent-chatbot-container {
            width: ${CHATBOT_CONFIG.iframe.dimensions.pc.containerWidth} !important;
          }
          
          #transparent-chatbot-iframe {
            width: ${CHATBOT_CONFIG.iframe.dimensions.pc.width} !important;
            min-width: ${CHATBOT_CONFIG.iframe.dimensions.pc.minWidth} !important; /* PC minimum width requirement */
            max-width: ${CHATBOT_CONFIG.iframe.dimensions.pc.maxWidth} !important;
          }
        }
        
        /* Mobile styles - 100% screen coverage */
        @media (max-width: ${CHATBOT_CONFIG.responsive.mobileBreakpoint}px) {
          #transparent-chatbot-container {
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            top: 0 !important;
            width: ${CHATBOT_CONFIG.iframe.dimensions.mobile.width} !important; /* 100% of screen width */
            height: ${CHATBOT_CONFIG.iframe.dimensions.mobile.height} !important; /* 100% of screen height */
          }
          
          #transparent-chatbot-iframe {
            width: ${CHATBOT_CONFIG.iframe.dimensions.mobile.width} !important; /* 100% of screen width */
            height: ${CHATBOT_CONFIG.iframe.dimensions.mobile.height} !important; /* 100% of screen height */
            min-width: unset !important;
            max-width: ${CHATBOT_CONFIG.iframe.dimensions.mobile.maxWidth} !important;
            max-height: ${CHATBOT_CONFIG.iframe.dimensions.mobile.maxHeight} !important;
            border-radius: 0 !important;
          }
        }
      `;
      document.head.appendChild(styleTag);
    }
  }

  validateDimensions() {
    const iframe = this.iframe;
    if (!iframe) return false;
    
    const computedStyle = window.getComputedStyle(iframe);
    const width = parseInt(computedStyle.width);
    const isMobile = window.innerWidth <= CHATBOT_CONFIG.responsive.mobileBreakpoint;
    
    if (!isMobile && width < 500) {
      log('PC iframe width below minimum 500px requirement:', width);
      this.forceWidthCorrection();
      return false;
    }
    
    return true;
  }

  forceWidthCorrection() {
    if (this.iframe) {
      this.iframe.style.width = CHATBOT_CONFIG.iframe.dimensions.pc.width;
      this.iframe.style.minWidth = CHATBOT_CONFIG.iframe.dimensions.pc.minWidth;
      this.iframe.style.maxWidth = CHATBOT_CONFIG.iframe.dimensions.pc.maxWidth;
      log('Width correction applied');
    }
  }

  ensureMinimumWidth() {
    setTimeout(() => {
      if (!this.validateDimensions()) {
        this.forceWidthCorrection();
      }
    }, 100);
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

  mount() {
    if (this.isCreated) return;

    this.applyCSSReset();

    const container = this.createContainer();
    const iframe = this.createIframe();

    container.appendChild(iframe);
    document.body.appendChild(container);

    this.isCreated = true;
    log('Transparent iframe mounted successfully');
    
    // Ensure minimum width after mounting
    this.ensureMinimumWidth();
  }

  destroy() {
    // Remove responsive styles
    const responsiveStyles = document.getElementById('transparent-chatbot-responsive-styles');
    if (responsiveStyles && responsiveStyles.parentNode) {
      responsiveStyles.parentNode.removeChild(responsiveStyles);
    }
    
    // Standard cleanup
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.iframe = null;
    this.container = null;
    this.isCreated = false;
  }

  sendMessage(message) {
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(message, '*');
    }
  }
}


  // === 3. STATE PERSISTENCE MANAGER ===
  class StatePersistenceManager {
    static saveState(state) {
      try {
        const stateData = {
          ...state,
          timestamp: Date.now(),
          sessionId: this.getSessionId()
        };
        localStorage.setItem(CHATBOT_CONFIG.stateKey, JSON.stringify(stateData));
        log('State saved successfully');
      } catch (error) {
        log('Failed to save state:', error);
      }
    }

    static loadState() {
      try {
        const stateData = localStorage.getItem(CHATBOT_CONFIG.stateKey);
        if (!stateData) return null;

        const parsed = JSON.parse(stateData);
        
        // Check if state is too old (24 hours)
        if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
          this.clearState();
          return null;
        }

        log('State loaded successfully');
        return parsed;
      } catch (error) {
        log('Failed to load state:', error);
        return null;
      }
    }

    static clearState() {
      try {
        localStorage.removeItem(CHATBOT_CONFIG.stateKey);
        log('State cleared successfully');
      } catch (error) {
        log('Failed to clear state:', error);
      }
    }

    static getSessionId() {
      let sessionId = sessionStorage.getItem('chatbot_session_id');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('chatbot_session_id', sessionId);
      }
      return sessionId;
    }
  }

  // === 4. PRODUCT VARIANT PROCESSOR ===
  class VariantProcessor {
    static processSizeVariants(variants) {
      const SIZE_ORDER = {
        'XS': 1, 'S': 2, 'M': 3, 'L': 4, 
        'XL': 5, '2XL': 6, 'XXL': 6, '3XL': 7
      };

      return variants
        .filter(variant => {
          const size = variant.option1 || variant.title;
          return size && (SIZE_ORDER[size.toUpperCase()] || size.includes('XL'));
        })
        .map(variant => ({
          id: variant.id,
          size: this.normalizeSize(variant.option1 || variant.title),
          available: variant.available,
          price: variant.price
        }))
        .sort((a, b) => (SIZE_ORDER[a.size] || 99) - (SIZE_ORDER[b.size] || 99));
    }

    static normalizeSize(size) {
      const normalized = size.toUpperCase();
      if (normalized === 'XXL' || normalized === '2XL') return '2XL';
      return normalized;
    }

    static processColorVariants(productVariants) {
      const colorVariants = productVariants
        .filter(variant => variant.option2 || variant.option3)
        .reduce((acc, variant) => {
          const color = variant.option2 || variant.option3;
          if (color && !acc.find(c => c.name === color)) {
            acc.push({
              id: variant.id,
              name: color,
              value: this.getColorValue(color),
              available: variant.available
            });
          }
          return acc;
        }, []);

      return {
        hasColors: colorVariants.length > 0,
        colors: colorVariants,
        showColorSection: colorVariants.length > 0,
        autoSelect: colorVariants.length === 1 ? colorVariants[0] : null,
        requireSelection: colorVariants.length > 1
      };
    }

    static getColorValue(colorName) {
      const colorMap = {
        'red': '#ef4444', 'blue': '#3b82f6', 'green': '#10b981',
        'black': '#000000', 'white': '#ffffff', 'gray': '#6b7280',
        'pink': '#ec4899', 'purple': '#8b5cf6', 'yellow': '#f59e0b',
        'orange': '#f97316', 'indigo': '#6366f1', 'teal': '#14b8a6'
      };
      
      return colorMap[colorName.toLowerCase()] || '#d1d5db';
    }

    static validateProductSelection(product, selectedOptions) {
      const colorConfig = this.processColorVariants(product.variants);
      const sizeConfig = this.processSizeVariants(product.variants);
      
      const errors = [];
      
      // Size validation
      if (sizeConfig.length > 1 && !selectedOptions.size) {
        errors.push('Please select a size');
      }
      
      // Color validation - only required if multiple colors exist
      if (colorConfig.requireSelection && !selectedOptions.color) {
        errors.push('Please select a color');
      }
      
      // Find matching variant
      let selectedVariant = null;
      if (errors.length === 0) {
        selectedVariant = this.findMatchingVariant(
          product.variants, 
          selectedOptions, 
          colorConfig, 
          sizeConfig
        );
        
        if (!selectedVariant) {
          errors.push('Selected combination not available');
        } else if (!selectedVariant.available) {
          errors.push('Selected variant is out of stock');
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
        variant: selectedVariant
      };
    }

    static findMatchingVariant(variants, selections, colorConfig, sizeConfig) {
      // Auto-select single options
      const finalSelections = {
        size: selections.size || (sizeConfig.length === 1 ? sizeConfig[0].size : null),
        color: selections.color || (colorConfig.autoSelect ? colorConfig.autoSelect.name : null)
      };
      
      return variants.find(variant => {
        const variantSize = variant.option1;
        const variantColor = variant.option2 || variant.option3;
        
        const sizeMatch = !finalSelections.size || variantSize === finalSelections.size;
        const colorMatch = !finalSelections.color || variantColor === finalSelections.color;
        
        return sizeMatch && colorMatch;
      });
    }
  }

  // === 5. CART INTEGRATION MANAGER ===
  class CartIntegrationManager {
    static async addToCart(variantId, quantity = 1, productData = null) {
      try {
        log('Adding to cart:', { variantId, quantity });

        const response = await fetch('https://zenmato.myshopify.com/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            items: [{ id: parseInt(variantId), quantity }],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        log('Successfully added to cart:', result);

        // Update cart count in UI
        this.updateCartCount(quantity);

        // Show success popup
        CartSuccessPopup.show(result, productData);

        // Trigger Shopify events
        this.triggerShopifyEvents(result);

        return result;
      } catch (error) {
        log('Failed to add to cart:', error);
        throw error;
      }
    }

    static updateCartCount(quantity) {
      const cartCountElements = document.querySelectorAll(
        '[data-cart-count], .cart-count, #cart-count'
      );
      cartCountElements.forEach((el) => {
        const currentCount = parseInt(el.textContent) || 0;
        el.textContent = currentCount + quantity;
      });
    }

    static triggerShopifyEvents(cartData) {
      // Trigger Shopify events
      if (window.Shopify && window.Shopify.onCartUpdate) {
        window.Shopify.onCartUpdate(cartData);
      }

      // Trigger custom events
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: cartData }));
    }
  }

  // === 6. CART SUCCESS POPUP ===
  class CartSuccessPopup {
    static show(cartData, productData = null) {
      // Remove existing popup
      this.hide();

      const popup = this.createPopup(cartData, productData);
      document.body.appendChild(popup);

      // Auto-close after delay
      setTimeout(() => {
        this.hide();
      }, CHATBOT_CONFIG.cart.popup.autoCloseDelay);

      log('Cart success popup shown');
    }

    static hide() {
      const existing = document.getElementById('cart-success-popup');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    }

    static createPopup(cartData, productData) {
      const isMobile = window.innerWidth < 768;
      
      const popup = document.createElement('div');
      popup.id = 'cart-success-popup';
      popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: ${CHATBOT_CONFIG.cart.popup.zIndex};
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
      `;

      const content = document.createElement('div');
      content.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        max-height: ${isMobile ? CHATBOT_CONFIG.cart.popup.mobileHeight : CHATBOT_CONFIG.cart.popup.desktopHeight};
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        position: relative;
        animation: slideUp 0.3s ease;
      `;

      content.innerHTML = this.getPopupHTML(cartData, productData);
      popup.appendChild(content);

      // Add event listeners
      this.addPopupEventListeners(popup, content);

      // Add CSS animations
      this.addPopupStyles();

      return popup;
    }

    static getPopupHTML(cartData, productData) {
      const item = cartData.items && cartData.items[0];
      const productName = productData?.title || item?.product_title || 'Product';
      const price = item ? `$${(item.price / 100).toFixed(2)}` : '';

      return `
        <div style="text-align: center;">
          <div style="width: 48px; height: 48px; background: #10b981; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          
          <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #111;">
            Added to Cart!
          </h3>
          
          <p style="margin: 0 0 16px; color: #666; font-size: 14px;">
            ${productName} ${price}
          </p>
          
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="cart-popup-continue" style="
              padding: 8px 16px;
              border: 1px solid #ddd;
              background: white;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            ">
              Continue Shopping
            </button>
            
            <button id="cart-popup-view" style="
              padding: 8px 16px;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            ">
              View Cart
            </button>
          </div>
          
          <button id="cart-popup-close" style="
            position: absolute;
            top: 12px;
            right: 12px;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #999;
          ">
            ×
          </button>
        </div>
      `;
    }

    static addPopupEventListeners(popup, content) {
      // Close button
      const closeBtn = content.querySelector('#cart-popup-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hide());
      }

      // Continue shopping
      const continueBtn = content.querySelector('#cart-popup-continue');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => this.hide());
      }

      // View cart
      const viewBtn = content.querySelector('#cart-popup-view');
      if (viewBtn) {
        viewBtn.addEventListener('click', () => {
          window.location.href = '/cart';
        });
      }

      // Click outside to close
      popup.addEventListener('click', (e) => {
        if (e.target === popup) {
          this.hide();
        }
      });
    }

    static addPopupStyles() {
      if (!document.getElementById('cart-popup-styles')) {
        const style = document.createElement('style');
        style.id = 'cart-popup-styles';
        style.textContent = `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }

  // === 7. NAVIGATION HANDLER ===
  class NavigationHandler {
    static init() {
      this.setupNavigationListeners();
      this.restoreState();
    }

    static setupNavigationListeners() {
      // Before page unload
      window.addEventListener('beforeunload', () => {
        this.saveCurrentState();
      });

      // Page visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.saveCurrentState();
        }
      });

      // History navigation
      window.addEventListener('popstate', () => {
        setTimeout(() => {
          this.restoreState();
        }, 100);
      });

      log('Navigation handlers initialized');
    }

    static saveCurrentState() {
      const state = {
        isOpen: true, // Assume open since iframe is always visible
        currentPage: getCurrentPageData(),
        shopifyData: DataExtractor.extractShopifyData(),
        lastActivity: Date.now()
      };

      StatePersistenceManager.saveState(state);
    }

    static restoreState() {
      const savedState = StatePersistenceManager.loadState();
      if (savedState) {
        // Update iframe with restored state
        const iframeManager = window.transparentChatbotManager;
        if (iframeManager) {
          iframeManager.sendMessage({
            type: 'RESTORE_STATE',
            data: savedState
          });
        }
        log('State restored from navigation');
      }
    }
  }

  // === 8. MESSAGE HANDLER ===
  class MessageHandler {
    static init(iframeManager) {
      this.iframeManager = iframeManager;
      this.setupMessageListeners();
    }

    static setupMessageListeners() {
      window.addEventListener('message', (event) => {
        // Validate origin
        const allowedOrigins = [
          CHATBOT_CONFIG.apiUrl.replace(/https?:\/\//, ''),
          'localhost:3000',
          '127.0.0.1:3000',
          window.location.hostname
        ];

        const eventOrigin = event.origin.replace(/https?:\/\//, '');
        if (!allowedOrigins.some(origin => eventOrigin.includes(origin))) {
          return;
        }

        const { type, data } = event.data;
        log('Received message:', type, data);

        this.handleMessage(type, data);
      });

      log('Message listeners initialized');
    }

    static async handleMessage(type, data) {
      switch (type) {
        case 'ADD_TO_CART':
          await this.handleAddToCart(data);
          break;

        case 'CHATBOT_STATE_CHANGED':
          this.handleStateChanged(data);
          break;

        case 'GET_SHOPIFY_DATA':
          this.handleShopifyDataRequest();
          break;

        case 'VALIDATE_SELECTION':
          this.handleValidateSelection(data);
          break;

        case 'SAVE_STATE':
          NavigationHandler.saveCurrentState();
          break;

        case 'NAVIGATE_TO_PRODUCT':
          if (data.url) {
            window.location.href = data.url;
          }
          break;

        default:
          log('Unknown message type:', type);
      }
    }

    static async handleAddToCart(data) {
      const { variantId, quantity = 1, product } = data;
      
      try {
        // Validate variant selection if product data provided
        if (product) {
          const validation = VariantProcessor.validateProductSelection(
            product, 
            data.selectedOptions || {}
          );
          
          if (!validation.valid) {
            this.iframeManager.sendMessage({
              type: 'ADD_TO_CART_ERROR',
              error: validation.errors.join(', ')
            });
            return;
          }
        }

        const result = await CartIntegrationManager.addToCart(variantId, quantity, product);
        
        this.iframeManager.sendMessage({
          type: 'ADD_TO_CART_SUCCESS',
          data: result
        });

      } catch (error) {
        log('Add to cart failed:', error);
        this.iframeManager.sendMessage({
          type: 'ADD_TO_CART_ERROR',
          error: error.message
        });
      }
    }

    static handleStateChanged(data) {
      StatePersistenceManager.saveState({
        ...data,
        currentPage: getCurrentPageData(),
        shopifyData: DataExtractor.extractShopifyData()
      });
    }

    static handleShopifyDataRequest() {
      const shopifyData = DataExtractor.extractShopifyData();
      this.iframeManager.sendMessage({
        type: 'SHOPIFY_DATA_RESPONSE',
        data: shopifyData
      });
    }

    static handleValidateSelection(data) {
      const { product, selectedOptions } = data;
      const validation = VariantProcessor.validateProductSelection(product, selectedOptions);
      
      this.iframeManager.sendMessage({
        type: 'VALIDATION_RESULT',
        data: validation
      });
    }
  }

  // === MAIN INITIALIZATION ===
  class TransparentChatbotEmbedManager {
    constructor() {
      this.iframeManager = new TransparentIframeManager();
      this.isInitialized = false;
    }

    init() {
      if (this.isInitialized) {
        log('Already initialized');
        return;
      }

      try {
        log('Initializing transparent chatbot embed...');

        // Check for required data
        const validation = DataExtractor.validateData(DataExtractor.extractShopifyData());
        if (!validation.isValid) {
          log('Warning: Invalid Shopify data detected');
        }

        // Mount iframe
        this.iframeManager.mount();

        // Initialize handlers
        MessageHandler.init(this.iframeManager);
        NavigationHandler.init();

        // Mark as initialized
        this.isInitialized = true;

        // Expose API
        window.transparentChatbotManager = this;

        log('Transparent chatbot embed initialized successfully');

      } catch (error) {
        log('Failed to initialize:', error);
      }
    }

    // Public API methods
    updateShopifyData() {
      const shopifyData = DataExtractor.extractShopifyData();
      this.iframeManager.sendMessage({
        type: 'SHOPIFY_DATA_UPDATE',
        data: shopifyData
      });
    }

    destroy() {
      this.iframeManager.destroy();
      CartSuccessPopup.hide();
      this.isInitialized = false;
      delete window.transparentChatbotManager;
    }

    sendMessage(message) {
      this.iframeManager.sendMessage(message);
    }
  }

  // === AUTO-INITIALIZATION ===
  function initializeWhenReady() {
    const manager = new TransparentChatbotEmbedManager();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => manager.init());
    } else {
      manager.init();
    }
  }

  // Start initialization
  initializeWhenReady();

})();