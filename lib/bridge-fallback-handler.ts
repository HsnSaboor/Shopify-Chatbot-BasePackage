/**
 * Bridge Fallback Handler for Shopify PostMessage Bridge
 * Provides fallback mechanisms when postMessage communication fails
 */

export interface FallbackConfig {
  enableFallback: boolean;
  fallbackTimeout: number;
  maxRetryAttempts: number;
  retryDelay: number;
  useDirectAPI: boolean;
  useLocalStorageCache: boolean;
}

export interface FallbackContext {
  operation: string;
  payload: any;
  error: Error;
  attempt: number;
}

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  name: string;
  price: string;
  image: string;
}

export interface CartResponse {
  items: CartItem[];
  total_price: number;
  item_count: number;
  currency: string;
}

export class BridgeFallbackHandler {
  private config: FallbackConfig;
  private localStorageKey = 'shopify_cart_fallback_cache';
  private isFallbackActive = false;

  constructor(config: FallbackConfig) {
    this.config = config;
  }

  /**
   * Handle fallback for a failed bridge operation
   */
  async handleFallback(context: FallbackContext): Promise<any> {
    if (!this.config.enableFallback) {
      throw new Error(`Bridge operation failed: ${context.error.message}`);
    }

    console.warn(`Bridge fallback triggered for operation: ${context.operation}`, {
      attempt: context.attempt,
      error: context.error.message
    });

    // Mark fallback as active
    this.isFallbackActive = true;

    try {
      switch (context.operation) {
        case 'CART_ADD_ITEM':
          return await this.handleAddToCartFallback(context.payload);
        
        case 'CART_GET':
          return await this.handleGetCartFallback();
        
        case 'CART_UPDATE':
          return await this.handleUpdateCartFallback(context.payload);
        
        case 'CART_CLEAR':
          return await this.handleClearCartFallback();
        
        case 'NAVIGATE_TO_CART':
          return this.handleNavigateToCartFallback();
        
        case 'NAVIGATE_TO_CHECKOUT':
          return this.handleNavigateToCheckoutFallback();
        
        default:
          throw new Error(`No fallback available for operation: ${context.operation}`);
      }
    } catch (fallbackError) {
      console.error(`Fallback operation failed for ${context.operation}:`, fallbackError);
      
      // If this is not the last attempt, throw the original error to allow retry
      if (context.attempt < this.config.maxRetryAttempts) {
        throw context.error;
      }
      
      // Otherwise, throw the fallback error
      throw fallbackError;
    }
  }

  /**
   * Handle add to cart fallback using direct API
   */
  private async handleAddToCartFallback(payload: any): Promise<{ cart: CartResponse }> {
    if (!this.config.useDirectAPI) {
      throw new Error('Direct API fallback disabled');
    }

    const { variantId, quantity = 1, properties = {} } = payload;
    
    // Validate inputs
    if (!variantId || isNaN(Number(variantId))) {
      throw new Error('Invalid variant ID');
    }
    
    if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
      throw new Error('Invalid quantity');
    }

    try {
      const requestBody = {
        items: [{
          id: Number.parseInt(variantId),
          quantity: quantity,
          properties: properties
        }]
      };

      const response = await this.makeDirectRequest('POST', '/cart/add.js', requestBody);
      const result = await response.json();
      
      // Get updated cart
      const cart = await this.getCartDirect();
      
      // Cache cart data
      if (this.config.useLocalStorageCache) {
        this.cacheCartData(cart);
      }
      
      return { cart };
    } catch (error) {
      throw new Error(`Direct API add to cart failed: ${error.message}`);
    }
  }

  /**
   * Handle get cart fallback
   */
  private async handleGetCartFallback(): Promise<CartResponse> {
    if (!this.config.useDirectAPI) {
      // Try to get cached data
      if (this.config.useLocalStorageCache) {
        const cachedCart = this.getCachedCartData();
        if (cachedCart) {
          return cachedCart;
        }
      }
      
      throw new Error('Direct API fallback disabled and no cached data available');
    }

    try {
      const cart = await this.getCartDirect();
      
      // Cache cart data
      if (this.config.useLocalStorageCache) {
        this.cacheCartData(cart);
      }
      
      return cart;
    } catch (error) {
      // Try to return cached data if available
      if (this.config.useLocalStorageCache) {
        const cachedCart = this.getCachedCartData();
        if (cachedCart) {
          return cachedCart;
        }
      }
      
      throw new Error(`Direct API get cart failed: ${error.message}`);
    }
  }

  /**
   * Handle update cart fallback
   */
  private async handleUpdateCartFallback(payload: any): Promise<{ cart: CartResponse }> {
    if (!this.config.useDirectAPI) {
      throw new Error('Direct API fallback disabled');
    }

    const { updates } = payload;
    
    try {
      const response = await this.makeDirectRequest('POST', '/cart/update.js', { updates });
      await response.json(); // Consume response
      
      // Get updated cart
      const cart = await this.getCartDirect();
      
      // Cache cart data
      if (this.config.useLocalStorageCache) {
        this.cacheCartData(cart);
      }
      
      return { cart };
    } catch (error) {
      throw new Error(`Direct API update cart failed: ${error.message}`);
    }
  }

  /**
   * Handle clear cart fallback
   */
  private async handleClearCartFallback(): Promise<{ cart: CartResponse }> {
    if (!this.config.useDirectAPI) {
      throw new Error('Direct API fallback disabled');
    }

    try {
      const response = await this.makeDirectRequest('POST', '/cart/clear.js');
      await response.json(); // Consume response
      
      // Get updated cart (should be empty)
      const cart = await this.getCartDirect();
      
      // Cache cart data
      if (this.config.useLocalStorageCache) {
        this.cacheCartData(cart);
      }
      
      return { cart };
    } catch (error) {
      throw new Error(`Direct API clear cart failed: ${error.message}`);
    }
  }

  /**
   * Handle navigate to cart fallback
   */
  private handleNavigateToCartFallback(): { success: boolean } {
    try {
      window.location.href = '/cart';
      return { success: true };
    } catch (error) {
      throw new Error(`Navigate to cart failed: ${error.message}`);
    }
  }

  /**
   * Handle navigate to checkout fallback
   */
  private handleNavigateToCheckoutFallback(): { success: boolean } {
    try {
      window.location.href = '/checkout';
      return { success: true };
    } catch (error) {
      throw new Error(`Navigate to checkout failed: ${error.message}`);
    }
  }

  /**
   * Make direct API request to Shopify
   */
  private async makeDirectRequest(
    method: 'GET' | 'POST', 
    endpoint: string, 
    body?: any
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.fallbackTimeout);

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      };
      
      if (body && method === 'POST') {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(endpoint, options);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out during fallback');
      }
      throw error;
    }
  }

  /**
   * Get cart directly from Shopify API
   */
  private async getCartDirect(): Promise<CartResponse> {
    const response = await this.makeDirectRequest('GET', '/cart.js');
    const cart = await response.json();
    
    const cartResponse: CartResponse = {
      items: cart.items.map((item: any) => ({
        id: item.id.toString(),
        variantId: item.variant_id.toString(),
        quantity: item.quantity,
        name: item.product_title,
        price: this.formatPrice(item.price, cart.currency),
        image: item.image,
      })),
      total_price: cart.total_price,
      item_count: cart.item_count,
      currency: cart.currency,
    };
    
    return cartResponse;
  }

  /**
   * Format price from cents to currency string
   */
  private formatPrice(price: number, currency = 'USD'): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(price / 100); // Shopify prices are in cents
    } catch (error) {
      // Fallback formatting
      return `$${(price / 100).toFixed(2)}`;
    }
  }

  /**
   * Cache cart data in localStorage
   */
  private cacheCartData(cart: CartResponse): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const cacheData = {
          cart,
          timestamp: Date.now(),
          expires: Date.now() + (5 * 60 * 1000) // 5 minutes expiration
        };
        localStorage.setItem(this.localStorageKey, JSON.stringify(cacheData));
      }
    } catch (error) {
      console.warn('Failed to cache cart data:', error);
    }
  }

  /**
   * Get cached cart data from localStorage
   */
  private getCachedCartData(): CartResponse | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const cachedData = localStorage.getItem(this.localStorageKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          
          // Check if cache is still valid
          if (parsed.expires > Date.now()) {
            return parsed.cart;
          } else {
            // Remove expired cache
            localStorage.removeItem(this.localStorageKey);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get cached cart data:', error);
    }
    
    return null;
  }

  /**
   * Clear cached cart data
   */
  clearCache(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.localStorageKey);
      }
    } catch (error) {
      console.warn('Failed to clear cart cache:', error);
    }
  }

  /**
   * Check if fallback is currently active
   */
  isFallbackCurrentlyActive(): boolean {
    return this.isFallbackActive;
  }

  /**
   * Reset fallback active status
   */
  resetFallbackStatus(): void {
    this.isFallbackActive = false;
  }

  /**
   * Get current configuration
   */
  getConfig(): FallbackConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Wait for a specified delay
   */
  async waitForDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default fallback configuration
export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  enableFallback: true,
  fallbackTimeout: 5000,
  maxRetryAttempts: 2,
  retryDelay: 1000,
  useDirectAPI: true,
  useLocalStorageCache: true
};

export default BridgeFallbackHandler;