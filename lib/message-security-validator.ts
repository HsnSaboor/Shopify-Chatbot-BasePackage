/**
 * Message Security Validator for Shopify PostMessage Bridge
 * Provides comprehensive security validation for cross-origin communication
 */

export interface SecurityConfig {
  allowedOrigins: string[];
  maxMessageSize: number;
  rateLimit: {
    maxRequestsPerMinute: number;
    windowMs: number;
  };
  allowedMessageTypes: string[];
  validateMessages: boolean;
  sanitizeInputs: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  sanitizedPayload?: any;
}

export interface RateLimitInfo {
  requests: number[];
  isRateLimited: boolean;
}

export class MessageSecurityValidator {
  private requestCounts: Map<string, number[]> = new Map();
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Validate incoming message event
   */
  validateMessageEvent(event: MessageEvent): ValidationResult {
    if (!this.config.validateMessages) {
      return { isValid: true };
    }

    // Check message structure
    if (!event.data || typeof event.data !== 'object') {
      return { 
        isValid: false, 
        reason: 'Invalid message structure - not an object' 
      };
    }

    // Check message type
    if (!event.data.type) {
      return { 
        isValid: false, 
        reason: 'Missing message type' 
      };
    }

    // Check allowed message types
    if (!this.config.allowedMessageTypes.includes(event.data.type)) {
      return { 
        isValid: false, 
        reason: `Unauthorized message type: ${event.data.type}` 
      };
    }

    // Check message size
    const messageSize = JSON.stringify(event.data).length;
    if (messageSize > this.config.maxMessageSize) {
      return { 
        isValid: false, 
        reason: `Message too large: ${messageSize} bytes` 
      };
    }

    // Validate origin
    if (!this.isAllowedOrigin(event.origin)) {
      return { 
        isValid: false, 
        reason: `Unauthorized origin: ${event.origin}` 
      };
    }

    // Check rate limiting
    if (this.isRateLimited(event.origin)) {
      return { 
        isValid: false, 
        reason: `Rate limit exceeded for origin: ${event.origin}` 
      };
    }

    // Sanitize payload if enabled
    let sanitizedPayload = event.data.payload;
    if (this.config.sanitizeInputs && event.data.payload) {
      sanitizedPayload = this.sanitizeInput(event.data.payload);
    }

    // Record this request for rate limiting
    this.recordRequest(event.origin);

    return { 
      isValid: true,
      sanitizedPayload
    };
  }

  /**
   * Check if origin is allowed
   */
  isAllowedOrigin(origin: string): boolean {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Allow same origin
    if (origin === window.location.origin) {
      return true;
    }

    // Check against allowed origins list
    return this.config.allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin === origin) return true;
      
      // Allow subdomains for localhost
      if (allowedOrigin.includes('localhost') && origin.includes('localhost')) {
        return true;
      }
      
      // Allow subdomains of allowed origins
      try {
        const allowedUrl = new URL(allowedOrigin);
        const originUrl = new URL(origin);
        
        if (originUrl.hostname.endsWith('.' + allowedUrl.hostname)) {
          return true;
        }
      } catch (e) {
        // If URL parsing fails, fall back to exact match
        return false;
      }
      
      return false;
    });
  }

  /**
   * Check if origin is rate limited
   */
  isRateLimited(origin: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.rateLimit.windowMs;
    
    if (!this.requestCounts.has(origin)) {
      return false;
    }
    
    const requests = this.requestCounts.get(origin) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    return recentRequests.length >= this.config.rateLimit.maxRequestsPerMinute;
  }

  /**
   * Record request for rate limiting
   */
  recordRequest(origin: string): void {
    const now = Date.now();
    const windowStart = now - this.config.rateLimit.windowMs;
    
    if (!this.requestCounts.has(origin)) {
      this.requestCounts.set(origin, []);
    }
    
    const requests = this.requestCounts.get(origin) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    recentRequests.push(now);
    this.requestCounts.set(origin, recentRequests);
  }

  /**
   * Get rate limit info for an origin
   */
  getRateLimitInfo(origin: string): RateLimitInfo {
    const now = Date.now();
    const windowStart = now - this.config.rateLimit.windowMs;
    
    const requests = this.requestCounts.get(origin) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    return {
      requests: recentRequests,
      isRateLimited: recentRequests.length >= this.config.rateLimit.maxRequestsPerMinute
    };
  }

  /**
   * Sanitize input to prevent XSS and other injection attacks
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potentially dangerous characters while preserving valid data
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
    }
    
    if (typeof input === 'object' && input !== null) {
      // Recursively sanitize object properties
      if (Array.isArray(input)) {
        return input.map(item => this.sanitizeInput(item));
      }
      
      const sanitized: any = {};
      for (const key in input) {
        if (input.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeInput(input[key]);
        }
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Validate variant ID format
   */
  validateVariantId(variantId: string): boolean {
    // Ensure variant ID is a valid positive integer
    const id = parseInt(variantId, 10);
    return !isNaN(id) && id > 0 && id < Number.MAX_SAFE_INTEGER;
  }

  /**
   * Validate quantity format
   */
  validateQuantity(quantity: number): boolean {
    // Ensure quantity is a valid positive integer within reasonable limits
    return Number.isInteger(quantity) && quantity > 0 && quantity <= 999;
  }

  /**
   * Validate and sanitize cart item data
   */
  validateCartItem(item: any): ValidationResult {
    if (!item || typeof item !== 'object') {
      return { 
        isValid: false, 
        reason: 'Invalid cart item structure' 
      };
    }

    // Validate required fields
    if (!item.variantId) {
      return { 
        isValid: false, 
        reason: 'Missing variant ID' 
      };
    }

    if (!this.validateVariantId(item.variantId)) {
      return { 
        isValid: false, 
        reason: 'Invalid variant ID format' 
      };
    }

    if (item.quantity !== undefined && !this.validateQuantity(item.quantity)) {
      return { 
        isValid: false, 
        reason: 'Invalid quantity' 
      };
    }

    // Sanitize optional fields
    const sanitizedItem: any = {
      variantId: item.variantId,
      quantity: item.quantity || 1
    };

    if (item.properties) {
      sanitizedItem.properties = this.sanitizeInput(item.properties);
    }

    return { 
      isValid: true,
      sanitizedPayload: sanitizedItem
    };
  }

  /**
   * Reset rate limiting for an origin (for testing purposes)
   */
  resetRateLimit(origin: string): void {
    this.requestCounts.delete(origin);
  }

  /**
   * Get current configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Default security configuration
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  allowedOrigins: [
    'https://shopify-ai-chatbot-v2.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  maxMessageSize: 1024 * 100, // 100KB max message size
  rateLimit: {
    maxRequestsPerMinute: 60,
    windowMs: 60000
  },
  allowedMessageTypes: [
    'CART_ADD_ITEM',
    'CART_GET',
    'CART_UPDATE',
    'CART_CLEAR',
    'NAVIGATE_TO_CART',
    'NAVIGATE_TO_CHECKOUT',
    'GET_STORE_INFO',
    'BRIDGE_STATUS_REQUEST',
    'CART_UPDATED'
  ],
  validateMessages: true,
  sanitizeInputs: true
};

export default MessageSecurityValidator;