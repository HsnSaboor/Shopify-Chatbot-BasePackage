;(() => {
  "use strict";

  // Enhanced Configuration with Debug System
  const CHATBOT_CONFIG = {
    apiUrl: window.CHATBOT_API_URL || "https://shopify-ai-chatbot-v2.vercel.app",
    // Dynamic store URL will be set later by StoreURLDetector
    storeUrl: null,
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
      },
      retryAttempts: 2,
      timeout: 5000,
      validateVariants: true
    },
    logging: {
      level: 'debug', // 'debug', 'info', 'warn', 'error'
      context: true,  // Include context in logs
      performance: true, // Track performance metrics
      network: true   // Log network requests
    },
    storeDetection: {
      retryAttempts: 3,
      fallbackURL: null,
      validateSSL: true,
      preventHardcodedDomains: true // Prevent usage of hardcoded domains
    },
    cookies: {
      validation: {
        enabled: true,
        strictDomain: false, // Allow cross-subdomain cookies
        logErrors: true      // Log cookie extraction errors
      },
      shopifyNames: [
        '_shopify_y',
        '_shopify_s', 
        'cart_currency',
        'localization',
        'cart',
        '_orig_referrer',
        '_shopify_country',
        '_shopify_currency',
        '_shopify_checkout_token'
      ],
      extraction: {
        includeMetadata: true,
        validateDomain: true,
        fallbackOnError: true
      }
    },
    performance: {
      enabled: true,
      trackAPIRequests: true,
      trackUserInteractions: true,
      trackRenderTime: true,
      sampleRate: 1.0 // 100% sampling in debug mode
    },
    stateKey: "shopify_chatbot_state",
    debug: true // Enable by default for troubleshooting
  };

  // Environment-specific configuration adjustment
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('ngrok') || window.location.hostname.includes('127.0.0.1')) {
    CHATBOT_CONFIG.debug = true;
    CHATBOT_CONFIG.logging.level = 'debug';
    CHATBOT_CONFIG.performance.sampleRate = 1.0;
  } else {
    // Production mode - reduced logging but still visible for troubleshooting
    CHATBOT_CONFIG.debug = true; // Keep enabled for Shopify store troubleshooting
    CHATBOT_CONFIG.logging.level = 'info';
    CHATBOT_CONFIG.performance.sampleRate = 0.1; // 10% sampling in production
  }

  // Set dynamic store URL
  const urlParams = new URLSearchParams(window.location.search);
  const shopDomain = urlParams.get("shopDomain");
  CHATBOT_CONFIG.storeUrl = shopDomain ? `https://${shopDomain}` : window.location.origin;

  // === ENHANCED LOGGING SYSTEM ===
  class Logger {
    static log(level, context, ...args) {
      if (!CHATBOT_CONFIG.debug) return;
      
      const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
      const configLevel = logLevels[CHATBOT_CONFIG.logging.level] || 0;
      const messageLevel = logLevels[level] || 0;
      
      if (messageLevel < configLevel) return;
      
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [TRANSPARENT-CHATBOT] [${level.toUpperCase()}] [${context}]`;
      
      // Use appropriate console method
      const consoleMethod = console[level] || console.log;
      consoleMethod(logMessage, ...args);
    }
    
    static debug(context, ...args) {
      this.log('debug', context, ...args);
    }
    
    static info(context, ...args) {
      this.log('info', context, ...args);
    }
    
    static warn(context, ...args) {
      this.log('warn', context, ...args);
    }
    
    static error(context, ...args) {
      this.log('error', context, ...args);
    }
    
    static performance(context, operation, startTime, endTime, success = true) {
      if (!CHATBOT_CONFIG.logging.performance) return;
      
      const duration = endTime - startTime;
      this.debug('Performance', `${operation} completed in ${duration}ms`, {
        context,
        duration: `${duration}ms`,
        success,
        timestamp: new Date().toISOString()
      });
    }
    
    static network(context, method, url, status, duration) {
      if (!CHATBOT_CONFIG.logging.network) return;
      
      this.info('Network', `${method} ${url} - ${status} (${duration}ms)`, {
        method,
        url,
        status,
        duration: `${duration}ms`
      });
    }
  }

  // Legacy log function for backward compatibility
  function log(...args) {
    Logger.info('Legacy', ...args);
  }

  // Initial logging
  Logger.info('Initialization', 'Starting transparent chatbot embed...');
  Logger.info('Configuration', 'Detected store URL:', CHATBOT_CONFIG.storeUrl);
  Logger.debug('Configuration', 'Full config:', CHATBOT_CONFIG);

  // === DYNAMIC STORE URL DETECTION SYSTEM ===
  class StoreURLDetector {
    static detectStoreURL() {
      Logger.info('StoreDetection', 'Starting store URL detection...');
      
      const methods = [
        { name: 'URLParams', method: this.fromURLParams },
        { name: 'WindowLocation', method: this.fromWindowLocation },
        { name: 'ShopifyGlobal', method: this.fromShopifyGlobal },
        { name: 'Cookies', method: this.fromCookies },
        { name: 'MetaTags', method: this.fromMetaTags },
        { name: 'DocumentDomain', method: this.fromDocumentDomain }
      ];
      
      for (const { name, method } of methods) {
        try {
          const url = method.call(this);
          if (this.validateStoreURL(url)) {
            Logger.info('StoreDetection', `Store URL detected via ${name}:`, url);
            return url;
          } else if (url) {
            Logger.warn('StoreDetection', `Invalid URL from ${name}:`, url);
          }
        } catch (error) {
          Logger.warn('StoreDetection', `Method ${name} failed:`, error.message);
        }
      }
      
      Logger.error('StoreDetection', 'All detection methods failed, using fallback');
      return this.getFallbackURL();
    }
    
    static fromURLParams() {
      Logger.debug('StoreDetection', 'Checking URL parameters...');
      const urlParams = new URLSearchParams(window.location.search);
      const shopDomain = urlParams.get("shopDomain") || urlParams.get("shop") || urlParams.get("store");
      
      if (shopDomain) {
        const url = shopDomain.startsWith('http') ? shopDomain : `https://${shopDomain}`;
        Logger.debug('StoreDetection', 'Found shop domain in URL params:', shopDomain);
        return url;
      }
      
      return null;
    }
    
    static fromWindowLocation() {
      Logger.debug('StoreDetection', 'Checking window location...');
      const hostname = window.location.hostname;
      
      // Check if we're on a Shopify domain
      if (hostname.includes('.myshopify.com') || hostname.includes('.shopify.com')) {
        const url = `https://${hostname}`;
        Logger.debug('StoreDetection', 'Detected Shopify domain:', hostname);
        return url;
      }
      
      // Check for custom domains that might be Shopify stores
      if (this.isLikelyShopifyStore()) {
        const url = window.location.origin;
        Logger.debug('StoreDetection', 'Detected likely Shopify store on custom domain:', hostname);
        return url;
      }
      
      return null;
    }
    
    static fromShopifyGlobal() {
      Logger.debug('StoreDetection', 'Checking Shopify global variables...');
      
      // Check window.Shopify.shop
      if (window.Shopify && window.Shopify.shop) {
        const shopDomain = window.Shopify.shop;
        const url = shopDomain.startsWith('http') ? shopDomain : `https://${shopDomain}`;
        Logger.debug('StoreDetection', 'Found Shopify.shop:', shopDomain);
        return url;
      }
      
      // Check window.shop if available
      if (window.shop && typeof window.shop === 'string') {
        const shopDomain = window.shop;
        const url = shopDomain.startsWith('http') ? shopDomain : `https://${shopDomain}`;
        Logger.debug('StoreDetection', 'Found window.shop:', shopDomain);
        return url;
      }
      
      return null;
    }
    
    static fromCookies() {
      Logger.debug('StoreDetection', 'Checking cookies...');
      
      // Look for Shopify-specific cookies
      const shopifyCookies = ['_shopify_s', '_shopify_y', 'cart', '_orig_referrer'];
      
      for (const cookieName of shopifyCookies) {
        const cookieValue = getCookie(cookieName);
        if (cookieValue) {
          Logger.debug('StoreDetection', `Found Shopify cookie ${cookieName}, assuming current domain is store`);
          return window.location.origin;
        }
      }
      
      return null;
    }
    
    static fromMetaTags() {
      Logger.debug('StoreDetection', 'Checking meta tags...');
      
      // Look for Shopify-specific meta tags
      const metaSelectors = [
        'meta[name="shopify-checkout-api-token"]',
        'meta[name="shopify-digital-wallet"]',
        'meta[property="og:url"]',
        'link[rel="canonical"]'
      ];
      
      for (const selector of metaSelectors) {
        const metaTag = document.querySelector(selector);
        if (metaTag) {
          const content = metaTag.getAttribute('content') || metaTag.getAttribute('href');
          if (content && (content.includes('.myshopify.com') || content.includes('.shopify.com'))) {
            try {
              const url = new URL(content);
              const storeUrl = `https://${url.hostname}`;
              Logger.debug('StoreDetection', `Found store URL in meta tag ${selector}:`, storeUrl);
              return storeUrl;
            } catch (e) {
              Logger.debug('StoreDetection', `Invalid URL in meta tag ${selector}:`, content);
            }
          }
        }
      }
      
      return null;
    }
    
    static fromDocumentDomain() {
      Logger.debug('StoreDetection', 'Checking document domain...');
      
      // Last resort - check if current domain has Shopify indicators
      const indicators = [
        () => document.querySelector('script[src*="shopify"]'),
        () => document.querySelector('link[href*="shopify"]'),
        () => document.querySelector('[data-shopify]'),
        () => window.ShopifyAnalytics,
        () => window.Shopify
      ];
      
      for (const indicator of indicators) {
        if (indicator()) {
          Logger.debug('StoreDetection', 'Found Shopify indicator, using current origin');
          return window.location.origin;
        }
      }
      
      return null;
    }
    
    static isLikelyShopifyStore() {
      // Check for common Shopify patterns in the page
      const shopifyIndicators = [
        () => document.querySelector('body[class*="template-"]'),
        () => document.querySelector('.shopify-section'),
        () => document.querySelector('#shopify-section'),
        () => document.querySelector('[data-section-type]'),
        () => window.theme || window.Shopify || window.ShopifyAnalytics
      ];
      
      return shopifyIndicators.some(indicator => {
        try {
          return indicator();
        } catch (e) {
          return false;
        }
      });
    }
    
    static validateStoreURL(url) {
      if (!url) return false;
      
      try {
        const urlObj = new URL(url);
        
        // Must be HTTPS for security
        if (CHATBOT_CONFIG.storeDetection.validateSSL && urlObj.protocol !== 'https:') {
          Logger.warn('StoreDetection', 'Non-HTTPS URL rejected:', url);
          return false;
        }
        
        // Check for Shopify domains or likely store domains
        const hostname = urlObj.hostname;
        const isShopifyDomain = hostname.includes('.myshopify.com') || hostname.includes('.shopify.com');
        const isValidDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(hostname) || hostname === 'localhost';
        
        if (isShopifyDomain || (isValidDomain && this.isLikelyShopifyStore())) {
          Logger.debug('StoreDetection', 'URL validation passed:', url);
          return true;
        }
        
        Logger.debug('StoreDetection', 'URL validation failed - not a valid store URL:', url);
        return false;
      } catch (error) {
        Logger.warn('StoreDetection', 'URL validation error:', error.message);
        return false;
      }
    }
    
    static getFallbackURL() {
      const fallback = CHATBOT_CONFIG.storeDetection.fallbackURL || window.location.origin;
      Logger.warn('StoreDetection', 'Using fallback URL:', fallback);
      return fallback;
    }
    
    static detectWithRetry() {
      const maxAttempts = CHATBOT_CONFIG.storeDetection.retryAttempts;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        Logger.debug('StoreDetection', `Detection attempt ${attempt}/${maxAttempts}`);
        
        const url = this.detectStoreURL();
        if (url && this.validateStoreURL(url)) {
          Logger.info('StoreDetection', `Successfully detected store URL on attempt ${attempt}:`, url);
          return url;
        }
        
        if (attempt < maxAttempts) {
          Logger.warn('StoreDetection', `Attempt ${attempt} failed, retrying...`);
          // Small delay before retry
          const delay = attempt * 100;
          setTimeout(() => {}, delay);
        }
      }
      
      Logger.error('StoreDetection', `All ${maxAttempts} attempts failed`);
      return this.getFallbackURL();
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

  // === 1. ENHANCED DATA EXTRACTOR WITH PROPER COOKIE HANDLING ===
  class DataExtractor {
    static extractShopifyData() {
      Logger.debug('DataExtractor', 'Starting Shopify data extraction...');
      
      // Use provided minimal data or extract from cookies
      if (window.SHOPIFY_MINIMAL_DATA) {
        Logger.info('DataExtractor', 'Using provided SHOPIFY_MINIMAL_DATA');
        return {
          ...window.SHOPIFY_MINIMAL_DATA,
          currentPage: getCurrentPageData(),
          storeURL: StoreURLDetector.detectWithRetry(),
          cookies: this.extractShopifyCookies()
        };
      }

      Logger.info('DataExtractor', 'Extracting data from cookies and environment');
      const extractedData = {
        customerId: this.extractCustomerId(),
        localization: this.extractLocalization(),
        cartCurrency: this.extractCartCurrency(),
        currentPage: getCurrentPageData(),
        storeURL: StoreURLDetector.detectWithRetry(),
        cookies: this.extractShopifyCookies()
      };
      
      Logger.debug('DataExtractor', 'Extracted Shopify data:', extractedData);
      return extractedData;
    }
    
    static extractShopifyCookies() {
      Logger.debug('DataExtractor', 'Extracting Shopify cookies for webhook transmission...');
      
      const detectedStoreURL = StoreURLDetector.detectWithRetry();
      const storeDomain = this.extractDomainFromURL(detectedStoreURL);
      
      // Validate that we're not using hardcoded domains
      if (CHATBOT_CONFIG.storeDetection.preventHardcodedDomains && 
          (storeDomain.includes('zenmato.myshopify.com') || detectedStoreURL.includes('zenmato.myshopify.com'))) {
        Logger.error('DataExtractor', 'CRITICAL: Hardcoded domain detected! This should not happen.', {
          detectedDomain: storeDomain,
          detectedURL: detectedStoreURL
        });
        
        // Force re-detection with fallback
        const fallbackDomain = window.location.hostname;
        Logger.warn('DataExtractor', 'Using current hostname as fallback:', fallbackDomain);
        const correctedStoreURL = `https://${fallbackDomain}`;
        
        return this.extractCookiesWithDomain(this.extractDomainFromURL(correctedStoreURL), correctedStoreURL);
      }
      
      Logger.debug('DataExtractor', 'Using store domain for cookies:', storeDomain);
      return this.extractCookiesWithDomain(storeDomain, detectedStoreURL);
    }
    
    static extractCookiesWithDomain(storeDomain, storeURL) {
      const shopifyCookieNames = CHATBOT_CONFIG.cookies.shopifyNames;
      
      const extractedCookies = {};
      const cookieErrors = [];
      
      for (const cookieName of shopifyCookieNames) {
        try {
          const cookieValue = this.extractCookieWithValidation(cookieName, storeDomain);
          if (cookieValue) {
            extractedCookies[cookieName] = cookieValue;
            Logger.debug('DataExtractor', `Successfully extracted cookie ${cookieName}`);
          }
        } catch (error) {
          const errorMsg = `Failed to extract cookie ${cookieName}: ${error.message}`;
          cookieErrors.push(errorMsg);
          if (CHATBOT_CONFIG.cookies.validation.logErrors) {
            Logger.warn('DataExtractor', errorMsg);
          }
        }
      }
      
      if (cookieErrors.length > 0 && CHATBOT_CONFIG.cookies.validation.logErrors) {
        Logger.warn('DataExtractor', 'Cookie extraction errors occurred:', cookieErrors);
      }
      
      Logger.info('DataExtractor', `Successfully extracted ${Object.keys(extractedCookies).length} Shopify cookies for domain: ${storeDomain}`);
      
      return {
        domain: storeDomain,
        storeURL: storeURL,
        cookies: extractedCookies,
        errors: cookieErrors,
        extractedAt: new Date().toISOString(),
        validationEnabled: CHATBOT_CONFIG.cookies.validation.enabled
      };
    }
    
    static extractCookieWithValidation(cookieName, expectedDomain) {
      const cookieValue = getCookie(cookieName);
      
      if (!cookieValue) {
        Logger.debug('DataExtractor', `Cookie ${cookieName} not found`);
        return null;
      }
      
      // Validate cookie domain context
      if (!this.validateCookieDomain(cookieName, expectedDomain)) {
        Logger.warn('DataExtractor', `Cookie ${cookieName} domain validation failed for ${expectedDomain}`);
        // Still return the cookie value but log the domain issue
        return cookieValue;
      }
      
      Logger.debug('DataExtractor', `Cookie ${cookieName} validated successfully for domain ${expectedDomain}`);
      return cookieValue;
    }
    
    static validateCookieDomain(cookieName, expectedDomain) {
      if (!CHATBOT_CONFIG.cookies.validation.enabled) {
        Logger.debug('DataExtractor', 'Cookie domain validation disabled');
        return true;
      }
      
      try {
        const currentDomain = window.location.hostname;
        
        Logger.debug('DataExtractor', `Validating cookie ${cookieName} for domain: current=${currentDomain}, expected=${expectedDomain}`);
        
        // Exact match
        if (currentDomain === expectedDomain) {
          return true;
        }
        
        // Subdomain match
        if (currentDomain.endsWith('.' + expectedDomain) || expectedDomain.endsWith('.' + currentDomain)) {
          return true;
        }
        
        // Shopify domain rules
        if ((currentDomain.includes('.myshopify.com') && expectedDomain.includes('.myshopify.com')) ||
            (currentDomain.includes('.shopify.com') && expectedDomain.includes('.shopify.com'))) {
          return true;
        }
        
        // Custom domain to Shopify domain mapping (common in Shopify setups)
        if (currentDomain !== expectedDomain && !CHATBOT_CONFIG.cookies.validation.strictDomain) {
          Logger.debug('DataExtractor', 'Allowing cross-domain cookie due to non-strict validation');
          return true;
        }
        
        Logger.debug('DataExtractor', `Domain validation failed: ${cookieName} - current=${currentDomain}, expected=${expectedDomain}`);
        return false;
      } catch (error) {
        Logger.warn('DataExtractor', 'Cookie domain validation error:', error.message);
        return CHATBOT_CONFIG.cookies.extraction.fallbackOnError;
      }
    }
    
    static extractDomainFromURL(url) {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname;
      } catch (error) {
        Logger.warn('DataExtractor', 'Failed to extract domain from URL:', url, error.message);
        return window.location.hostname; // Fallback to current domain
      }
    }
    
    static extractCustomerId() {
      const customerId = getCookie('_shopify_y');
      Logger.debug('DataExtractor', 'Customer ID extraction:', customerId ? 'Found' : 'Not found');
      return customerId || null;
    }
    
    static extractLocalization() {
      const localization = getCookie('localization') || 
                          getCookie('_shopify_country') || 
                          'en';
      Logger.debug('DataExtractor', 'Localization extracted:', localization);
      return localization;
    }
    
    static extractCartCurrency() {
      const currency = getCookie('cart_currency') || 
                      getCookie('_shopify_currency') || 
                      'USD';
      Logger.debug('DataExtractor', 'Cart currency extracted:', currency);
      return currency;
    }

    static validateData(data) {
      const isValid = data && typeof data === 'object';
      Logger.debug('DataExtractor', 'Data validation result:', isValid);
      
      return {
        isValid,
        data: data || {},
        timestamp: new Date().toISOString()
      };
    }
    
    static prepareWebhookData(additionalData = {}) {
      Logger.info('DataExtractor', 'Preparing webhook data...');
      
      const shopifyData = this.extractShopifyData();
      const webhookData = {
        shopifyData,
        additionalData,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          sessionId: StatePersistenceManager.getSessionId(),
          pageURL: window.location.href,
          referrer: document.referrer
        }
      };
      
      Logger.debug('DataExtractor', 'Webhook data prepared:', webhookData);
      return webhookData;
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

    // Enhanced data extraction for webhook transmission
    const webhookData = DataExtractor.prepareWebhookData();
    const src = `${CHATBOT_CONFIG.apiUrl}${CHATBOT_CONFIG.iframe.src}&shopifyData=${encodeURIComponent(JSON.stringify(webhookData.shopifyData))}`;
    this.iframe.src = src;
    
    Logger.info('IframeManager', 'Created iframe with enhanced Shopify data', {
      storeURL: webhookData.shopifyData.storeURL,
      cookieCount: Object.keys(webhookData.shopifyData.cookies?.cookies || {}).length,
      hasCustomerId: !!webhookData.shopifyData.customerId
    });

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

  // === 5. ENHANCED CART INTEGRATION MANAGER ===
  class CartIntegrationManager {
    static async addToCart(variantId, quantity = 1, productData = null) {
      const startTime = performance.now();
      let storeURL = null;
      
      try {
        // Detect store URL dynamically
        storeURL = StoreURLDetector.detectWithRetry();
        const cartEndpoint = `${storeURL}/cart/add.js`;
        
        Logger.info('CartAPI', 'Adding to cart:', { 
          variantId, 
          quantity, 
          endpoint: cartEndpoint,
          productData: productData?.title || 'Unknown Product'
        });

        // Validate inputs
        if (!this.validateInputs(variantId, quantity)) {
          throw new Error('Invalid cart parameters');
        }

        const requestBody = {
          items: [{ id: parseInt(variantId), quantity }],
        };

        Logger.debug('CartAPI', 'Request body:', requestBody);

        const response = await this.makeCartRequest(cartEndpoint, requestBody);
        const endTime = performance.now();
        
        Logger.network('CartAPI', 'POST', cartEndpoint, response.status, endTime - startTime);

        if (!response.ok) {
          throw new CartAPIError(`HTTP error! status: ${response.status}`, response.status, cartEndpoint);
        }

        const result = await response.json();
        Logger.info('CartAPI', 'Successfully added to cart:', result);
        Logger.performance('CartAPI', 'addToCart', startTime, endTime, true);

        // Update cart count in UI
        this.updateCartCount(quantity);

        // Show success popup
        CartSuccessPopup.show(result, productData);

        // Trigger Shopify events
        this.triggerShopifyEvents(result);

        return result;
      } catch (error) {
        const endTime = performance.now();
        Logger.performance('CartAPI', 'addToCart', startTime, endTime, false);
        Logger.error('CartAPI', 'Failed to add to cart:', {
          error: error.message,
          variantId,
          quantity,
          storeURL,
          stack: error.stack
        });
        
        // Handle specific error types
        const handledError = ErrorHandler.handleCartError(error, {
          variantId,
          quantity,
          storeURL,
          productData
        });
        
        // Rethrow with enhanced error information
        throw new Error(handledError.message || error.message);
      }
    }

    static validateInputs(variantId, quantity) {
      if (!variantId || isNaN(parseInt(variantId))) {
        Logger.error('CartAPI', 'Invalid variant ID:', variantId);
        return false;
      }
      
      if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
        Logger.error('CartAPI', 'Invalid quantity:', quantity);
        return false;
      }
      
      Logger.debug('CartAPI', 'Input validation passed');
      return true;
    }

    static async makeCartRequest(endpoint, requestBody) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CHATBOT_CONFIG.cart.timeout);
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Cart request timed out');
        }
        throw error;
      }
    }

    static async addToCartWithRetry(variantId, quantity = 1, productData = null) {
      const maxAttempts = CHATBOT_CONFIG.cart.retryAttempts;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          Logger.debug('CartAPI', `Attempt ${attempt}/${maxAttempts} to add to cart`);
          return await this.addToCart(variantId, quantity, productData);
        } catch (error) {
          Logger.warn('CartAPI', `Attempt ${attempt} failed:`, error.message);
          
          if (attempt === maxAttempts) {
            Logger.error('CartAPI', `All ${maxAttempts} attempts failed`);
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt - 1) * 1000;
          Logger.debug('CartAPI', `Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    static updateCartCount(quantity) {
      try {
        const cartCountElements = document.querySelectorAll(
          '[data-cart-count], .cart-count, #cart-count, .CartCount, [data-cart-item-count]'
        );
        
        Logger.debug('CartAPI', `Updating ${cartCountElements.length} cart count elements`);
        
        cartCountElements.forEach((el) => {
          const currentCount = parseInt(el.textContent) || 0;
          const newCount = currentCount + quantity;
          el.textContent = newCount;
          
          // Also update data attributes if they exist
          if (el.hasAttribute('data-cart-count')) {
            el.setAttribute('data-cart-count', newCount);
          }
        });
        
        Logger.info('CartAPI', `Cart count updated by ${quantity}`);
      } catch (error) {
        Logger.warn('CartAPI', 'Failed to update cart count:', error.message);
      }
    }

    static triggerShopifyEvents(cartData) {
      try {
        // Trigger Shopify events
        if (window.Shopify && window.Shopify.onCartUpdate) {
          Logger.debug('CartAPI', 'Triggering Shopify.onCartUpdate');
          window.Shopify.onCartUpdate(cartData);
        }
        
        // Trigger Analytics events
        if (window.ShopifyAnalytics && window.ShopifyAnalytics.lib) {
          Logger.debug('CartAPI', 'Triggering ShopifyAnalytics events');
          window.ShopifyAnalytics.lib.track('Added Product', {
            cart: cartData
          });
        }

        // Trigger custom events
        const customEvent = new CustomEvent('cart:updated', { 
          detail: { cartData, source: 'chatbot' }
        });
        window.dispatchEvent(customEvent);
        
        Logger.debug('CartAPI', 'All cart events triggered successfully');
      } catch (error) {
        Logger.warn('CartAPI', 'Failed to trigger some cart events:', error.message);
      }
    }
  }

  // === CART API ERROR CLASS ===
  class CartAPIError extends Error {
    constructor(message, status, endpoint) {
      super(message);
      this.name = 'CartAPIError';
      this.status = status;
      this.endpoint = endpoint;
    }
  }

  // === COMPREHENSIVE ERROR HANDLER ===
  class ErrorHandler {
    static handleCartError(error, context) {
      const errorCode = error.status || error.code || 'UNKNOWN';
      
      Logger.error('ErrorHandler', 'Cart error occurred:', {
        code: errorCode,
        message: error.message,
        context: context,
        stack: error.stack
      });
      
      switch (errorCode) {
        case 405:
          return this.handle405Error(error, context);
        case 404:
          return this.handle404Error(error, context);
        case 422:
          return this.handle422Error(error, context);
        case 429:
          return this.handle429Error(error, context);
        case 500:
        case 502:
        case 503:
          return this.handle5xxError(error, context);
        default:
          return this.handleGenericError(error, context);
      }
    }
    
    static handle405Error(error, context) {
      Logger.warn('ErrorHandler', '405 Method Not Allowed - checking endpoint URL');
      Logger.debug('ErrorHandler', 'Attempted endpoint:', context.storeURL);
      
      return {
        type: 'ENDPOINT_ERROR',
        message: 'Cart API endpoint not available. Please check store configuration.',
        suggestion: 'Verify cart API is enabled and store URL is correct.',
        recoverable: true,
        retryable: false
      };
    }
    
    static handle404Error(error, context) {
      Logger.warn('ErrorHandler', '404 Not Found - cart endpoint not available');
      
      return {
        type: 'NOT_FOUND_ERROR',
        message: 'Cart endpoint not found. Store may not support cart API.',
        suggestion: 'Check if the store has cart functionality enabled.',
        recoverable: false,
        retryable: false
      };
    }
    
    static handle422Error(error, context) {
      Logger.warn('ErrorHandler', '422 Unprocessable Entity - invalid cart data');
      
      return {
        type: 'VALIDATION_ERROR',
        message: 'Invalid product or variant data provided.',
        suggestion: 'Check variant ID and quantity are valid.',
        recoverable: true,
        retryable: false
      };
    }
    
    static handle429Error(error, context) {
      Logger.warn('ErrorHandler', '429 Too Many Requests - rate limited');
      
      return {
        type: 'RATE_LIMIT_ERROR',
        message: 'Too many requests. Please wait a moment and try again.',
        suggestion: 'Implement request throttling or retry after delay.',
        recoverable: true,
        retryable: true,
        retryDelay: 5000
      };
    }
    
    static handle5xxError(error, context) {
      Logger.warn('ErrorHandler', `${error.status} Server Error - store unavailable`);
      
      return {
        type: 'SERVER_ERROR',
        message: 'Store temporarily unavailable. Please try again later.',
        suggestion: 'Check store status or try again in a few minutes.',
        recoverable: true,
        retryable: true,
        retryDelay: 3000
      };
    }
    
    static handleGenericError(error, context) {
      Logger.error('ErrorHandler', 'Generic error handling:', {
        name: error.name,
        message: error.message,
        context
      });
      
      // Check for network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          type: 'NETWORK_ERROR',
          message: 'Network connection failed. Please check your internet connection.',
          suggestion: 'Verify internet connection and try again.',
          recoverable: true,
          retryable: true,
          retryDelay: 2000
        };
      }
      
      // Check for timeout errors
      if (error.message.includes('timeout') || error.name === 'AbortError') {
        return {
          type: 'TIMEOUT_ERROR',
          message: 'Request timed out. The store may be slow to respond.',
          suggestion: 'Try again or contact store support if problem persists.',
          recoverable: true,
          retryable: true,
          retryDelay: 1000
        };
      }
      
      return {
        type: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred.',
        suggestion: 'Please try again or contact support if the problem persists.',
        recoverable: false,
        retryable: false
      };
    }
    
    static logErrorForDebugging(error, context, userAgent = null) {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context,
        browser: {
          userAgent: userAgent || navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform
        },
        page: {
          url: window.location.href,
          referrer: document.referrer,
          title: document.title
        },
        chatbot: {
          version: '2.0.0',
          config: CHATBOT_CONFIG
        }
      };
      
      Logger.error('ErrorHandler', 'Debug information for support:', debugInfo);
      
      // Store in sessionStorage for potential support access
      try {
        const errorLog = JSON.parse(sessionStorage.getItem('chatbot_error_log') || '[]');
        errorLog.push(debugInfo);
        // Keep only last 10 errors
        if (errorLog.length > 10) {
          errorLog.splice(0, errorLog.length - 10);
        }
        sessionStorage.setItem('chatbot_error_log', JSON.stringify(errorLog));
      } catch (e) {
        Logger.warn('ErrorHandler', 'Failed to store error log:', e.message);
      }
    }
  }

  // === PERFORMANCE MONITORING SYSTEM ===
  class PerformanceMonitor {
    static metrics = {
      apiRequests: [],
      userInteractions: [],
      renderTimes: [],
      errors: []
    };
    
    static trackAPICall(endpoint, method, startTime, endTime, success, responseSize = 0) {
      if (!CHATBOT_CONFIG.performance.enabled || !CHATBOT_CONFIG.performance.trackAPIRequests) return;
      
      const duration = endTime - startTime;
      const metric = {
        timestamp: new Date().toISOString(),
        endpoint,
        method,
        duration,
        success,
        responseSize,
        userAgent: navigator.userAgent
      };
      
      this.metrics.apiRequests.push(metric);
      
      // Keep only last 50 metrics
      if (this.metrics.apiRequests.length > 50) {
        this.metrics.apiRequests.shift();
      }
      
      Logger.performance('PerformanceMonitor', `API ${method} ${endpoint}`, startTime, endTime, success);
      
      // Report slow requests
      if (duration > 3000) {
        Logger.warn('PerformanceMonitor', 'Slow API request detected:', {
          endpoint,
          method,
          duration: `${duration}ms`
        });
      }
    }
    
    static trackUserInteraction(action, element, startTime, endTime) {
      if (!CHATBOT_CONFIG.performance.enabled || !CHATBOT_CONFIG.performance.trackUserInteractions) return;
      
      const duration = endTime - startTime;
      const metric = {
        timestamp: new Date().toISOString(),
        action,
        element,
        duration
      };
      
      this.metrics.userInteractions.push(metric);
      
      // Keep only last 30 interactions
      if (this.metrics.userInteractions.length > 30) {
        this.metrics.userInteractions.shift();
      }
      
      Logger.debug('PerformanceMonitor', `User interaction: ${action} on ${element}`, {
        duration: `${duration}ms`
      });
    }
    
    static trackRenderTime(component, startTime, endTime) {
      if (!CHATBOT_CONFIG.performance.enabled || !CHATBOT_CONFIG.performance.trackRenderTime) return;
      
      const duration = endTime - startTime;
      const metric = {
        timestamp: new Date().toISOString(),
        component,
        duration
      };
      
      this.metrics.renderTimes.push(metric);
      
      // Keep only last 20 render times
      if (this.metrics.renderTimes.length > 20) {
        this.metrics.renderTimes.shift();
      }
      
      Logger.debug('PerformanceMonitor', `Render time for ${component}:`, {
        duration: `${duration}ms`
      });
      
      // Report slow renders
      if (duration > 100) {
        Logger.warn('PerformanceMonitor', 'Slow render detected:', {
          component,
          duration: `${duration}ms`
        });
      }
    }
    
    static trackError(error, context) {
      if (!CHATBOT_CONFIG.performance.enabled) return;
      
      const metric = {
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context
      };
      
      this.metrics.errors.push(metric);
      
      // Keep only last 20 errors
      if (this.metrics.errors.length > 20) {
        this.metrics.errors.shift();
      }
      
      Logger.error('PerformanceMonitor', 'Error tracked:', metric);
    }
    
    static getMetricsSummary() {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      
      const recentAPIRequests = this.metrics.apiRequests.filter(
        m => new Date(m.timestamp).getTime() > oneMinuteAgo
      );
      
      const recentErrors = this.metrics.errors.filter(
        m => new Date(m.timestamp).getTime() > oneMinuteAgo
      );
      
      const summary = {
        apiRequests: {
          total: recentAPIRequests.length,
          successful: recentAPIRequests.filter(r => r.success).length,
          failed: recentAPIRequests.filter(r => !r.success).length,
          averageDuration: recentAPIRequests.length > 0 
            ? recentAPIRequests.reduce((sum, r) => sum + r.duration, 0) / recentAPIRequests.length 
            : 0
        },
        errors: {
          total: recentErrors.length,
          types: [...new Set(recentErrors.map(e => e.error.name))]
        },
        performance: {
          slowRequests: recentAPIRequests.filter(r => r.duration > 2000).length,
          fastRequests: recentAPIRequests.filter(r => r.duration < 500).length
        }
      };
      
      Logger.info('PerformanceMonitor', 'Metrics summary (last minute):', summary);
      return summary;
    }
    
    static startPeriodicReporting() {
      if (!CHATBOT_CONFIG.performance.enabled) return;
      
      // Report metrics every 5 minutes
      setInterval(() => {
        this.getMetricsSummary();
      }, 5 * 60 * 1000);
      
      Logger.debug('PerformanceMonitor', 'Periodic reporting started');
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
            Logger.warn('MessageHandler', 'Variant validation failed:', validation.errors);
            this.iframeManager.sendMessage({
              type: 'ADD_TO_CART_ERROR',
              error: validation.errors.join(', ')
            });
            return;
          }
        }

        Logger.info('MessageHandler', 'Processing add to cart request:', {
          variantId,
          quantity,
          product: product?.title || 'Unknown'
        });

        // Use enhanced cart integration with retry
        const result = await CartIntegrationManager.addToCartWithRetry(variantId, quantity, product);
        
        Logger.info('MessageHandler', 'Add to cart successful');
        this.iframeManager.sendMessage({
          type: 'ADD_TO_CART_SUCCESS',
          data: result
        });

      } catch (error) {
        Logger.error('MessageHandler', 'Add to cart failed:', {
          error: error.message,
          variantId,
          quantity
        });
        
        // Track error for performance monitoring
        PerformanceMonitor.trackError(error, {
          operation: 'addToCart',
          variantId,
          quantity
        });
        
        this.iframeManager.sendMessage({
          type: 'ADD_TO_CART_ERROR',
          error: error.message
        });
      }
    }

    static handleStateChanged(data) {
      const webhookData = DataExtractor.prepareWebhookData(data);
      
      StatePersistenceManager.saveState({
        ...data,
        currentPage: getCurrentPageData(),
        shopifyData: webhookData.shopifyData
      });
      
      Logger.info('MessageHandler', 'State changed with enhanced data', {
        storeURL: webhookData.shopifyData.storeURL,
        cookieCount: Object.keys(webhookData.shopifyData.cookies?.cookies || {}).length
      });
    }

    static handleShopifyDataRequest() {
      const webhookData = DataExtractor.prepareWebhookData();
      
      Logger.info('MessageHandler', 'Sending enhanced Shopify data response', {
        storeURL: webhookData.shopifyData.storeURL,
        cookieCount: Object.keys(webhookData.shopifyData.cookies?.cookies || {}).length,
        hasErrors: webhookData.shopifyData.cookies?.errors?.length > 0
      });
      
      this.iframeManager.sendMessage({
        type: 'SHOPIFY_DATA_RESPONSE',
        data: webhookData
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
        Logger.warn('Initialization', 'Already initialized');
        return;
      }

      const initStartTime = performance.now();
      
      try {
        Logger.info('Initialization', 'Initializing transparent chatbot embed...');

        // Update configuration with dynamic store URL
        const detectedStoreURL = StoreURLDetector.detectWithRetry();
        CHATBOT_CONFIG.storeUrl = detectedStoreURL;
        Logger.info('Configuration', 'Updated store URL:', detectedStoreURL);

        // Check for required data
        const validation = DataExtractor.validateData(DataExtractor.extractShopifyData());
        if (!validation.isValid) {
          Logger.warn('Initialization', 'Invalid Shopify data detected, continuing with defaults');
        }

        // Start performance monitoring
        PerformanceMonitor.startPeriodicReporting();
        Logger.debug('Initialization', 'Performance monitoring started');

        // Mount iframe
        const mountStartTime = performance.now();
        this.iframeManager.mount();
        const mountEndTime = performance.now();
        PerformanceMonitor.trackRenderTime('IframeMount', mountStartTime, mountEndTime);

        // Initialize handlers
        MessageHandler.init(this.iframeManager);
        NavigationHandler.init();
        Logger.debug('Initialization', 'All handlers initialized');

        // Mark as initialized
        this.isInitialized = true;

        // Expose API
        window.transparentChatbotManager = this;

        const initEndTime = performance.now();
        Logger.info('Initialization', 'Transparent chatbot embed initialized successfully');
        PerformanceMonitor.trackRenderTime('FullInitialization', initStartTime, initEndTime);
        
        // Log final configuration
        Logger.debug('Configuration', 'Final configuration:', {
          storeUrl: CHATBOT_CONFIG.storeUrl,
          debug: CHATBOT_CONFIG.debug,
          logging: CHATBOT_CONFIG.logging,
          performance: CHATBOT_CONFIG.performance
        });

      } catch (error) {
        const initEndTime = performance.now();
        Logger.error('Initialization', 'Failed to initialize:', {
          error: error.message,
          stack: error.stack,
          duration: `${initEndTime - initStartTime}ms`
        });
        
        // Track initialization error
        PerformanceMonitor.trackError(error, {
          operation: 'initialization',
          stage: 'main_init'
        });
        
        // Store detailed error information for debugging
        ErrorHandler.logErrorForDebugging(error, {
          operation: 'initialization',
          config: CHATBOT_CONFIG
        });
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