export interface CartItem {
  id: string
  variantId: string
  quantity: number
  name: string
  price: string
  image: string
}

export interface CartResponse {
  items: CartItem[]
  total_price: number
  item_count: number
  currency: string
}

// Store URL Detection for TypeScript context
class StoreURLHelper {
  private static detectedStoreURL: string | null = null;
  
  static detectStoreURL(): string {
    if (this.detectedStoreURL) {
      return this.detectedStoreURL;
    }
    
    // Try multiple detection methods
    const methods = [
      this.fromURLParams,
      this.fromWindowLocation,
      this.fromShopifyGlobal,
      this.fromCurrentOrigin
    ];
    
    for (const method of methods) {
      try {
        const url = method();
        if (url && this.validateStoreURL(url)) {
          console.log(`[ShopifyCart] Store URL detected via ${method.name}:`, url);
          this.detectedStoreURL = url;
          return url;
        }
      } catch (error) {
        console.warn(`[ShopifyCart] Method ${method.name} failed:`, error);
      }
    }
    
    // Fallback to current origin
    const fallbackURL = window.location.origin;
    this.detectedStoreURL = fallbackURL;
    console.warn('[ShopifyCart] Using fallback URL:', fallbackURL);
    return fallbackURL;
  }
  
  private static fromURLParams(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    const shopDomain = urlParams.get("shopDomain") || urlParams.get("shop");
    return shopDomain ? `https://${shopDomain}` : null;
  }
  
  private static fromWindowLocation(): string | null {
    const hostname = window.location.hostname;
    if (hostname.includes('.myshopify.com') || hostname.includes('.shopify.com')) {
      return `https://${hostname}`;
    }
    return null;
  }
  
  private static fromShopifyGlobal(): string | null {
    if (typeof window !== 'undefined' && (window as any).Shopify?.shop) {
      const shopDomain = (window as any).Shopify.shop;
      return shopDomain.startsWith('http') ? shopDomain : `https://${shopDomain}`;
    }
    return null;
  }
  
  private static fromCurrentOrigin(): string {
    return window.location.origin;
  }
  
  private static validateStoreURL(url: string | null): boolean {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || urlObj.hostname === 'localhost';
    } catch {
      return false;
    }
  }
}

// Enhanced logging for cart operations
class CartLogger {
  private static debugEnabled = true; // Enable for troubleshooting
  
  static log(level: 'info' | 'warn' | 'error' | 'debug', context: string, ...args: any[]) {
    if (!this.debugEnabled) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [SHOPIFY-CART] [${level.toUpperCase()}] [${context}]`;
    
    const consoleMethod = console[level] || console.log;
    consoleMethod(logMessage, ...args);
  }
  
  static info(context: string, ...args: any[]) {
    this.log('info', context, ...args);
  }
  
  static warn(context: string, ...args: any[]) {
    this.log('warn', context, ...args);
  }
  
  static error(context: string, ...args: any[]) {
    this.log('error', context, ...args);
  }
  
  static debug(context: string, ...args: any[]) {
    this.log('debug', context, ...args);
  }
}

// Cart API Error class
class CartAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'CartAPIError';
  }
}

export class ShopifyCartService {
  private static readonly TIMEOUT = 5000;
  private static readonly RETRY_ATTEMPTS = 2;
  
  static async addToCart(variantId: string, quantity = 1): Promise<CartResponse> {
    const startTime = performance.now();
    let storeURL: string;
    
    try {
      // Detect store URL dynamically
      storeURL = StoreURLHelper.detectStoreURL();
      
      // Fix: Ensure correct endpoint path
      const endpoint = `${storeURL}${storeURL.endsWith('/') ? '' : '/'}cart/add.js`;
      
      CartLogger.info('AddToCart', 'Adding to cart:', {
        variantId,
        quantity,
        endpoint
      });
      
      // Validate inputs
      if (!this.validateInputs(variantId, quantity)) {
        throw new CartAPIError('Invalid cart parameters');
      }
      
      const requestBody = {
        items: [
          {
            id: Number.parseInt(variantId),
            quantity: quantity,
          },
        ],
      };
      
      CartLogger.debug('AddToCart', 'Request body:', requestBody);
      
      const response = await this.makeRequest('POST', endpoint, requestBody);
      const endTime = performance.now();
      
      CartLogger.info('AddToCart', `Request completed in ${endTime - startTime}ms`);
      
      if (!response.ok) {
        throw new CartAPIError(
          `Failed to add to cart: ${response.status}`,
          response.status,
          endpoint
        );
      }
      
      CartLogger.info('AddToCart', 'Successfully added to cart');
      
      // Get updated cart after adding item
      return await this.getCart();
    } catch (error) {
      const endTime = performance.now();
      CartLogger.error('AddToCart', 'Failed to add to cart:', {
        error: error instanceof Error ? error.message : String(error),
        variantId,
        quantity,
        duration: `${endTime - startTime}ms`
      });
      
      // Handle specific error types
      if (error instanceof CartAPIError) {
        throw error;
      }
      
      throw new CartAPIError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
  
  static async addToCartWithRetry(variantId: string, quantity = 1): Promise<CartResponse> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
      try {
        CartLogger.debug('AddToCart', `Attempt ${attempt}/${this.RETRY_ATTEMPTS}`);
        return await this.addToCart(variantId, quantity);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        CartLogger.warn('AddToCart', `Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < this.RETRY_ATTEMPTS) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          CartLogger.debug('AddToCart', `Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    CartLogger.error('AddToCart', `All ${this.RETRY_ATTEMPTS} attempts failed`);
    throw lastError!;
  }

  static async getCart(): Promise<CartResponse> {
    const startTime = performance.now();
    
    try {
      const storeURL = StoreURLHelper.detectStoreURL();
      const endpoint = `${storeURL}/cart.js`;
      
      CartLogger.debug('GetCart', 'Fetching cart from:', endpoint);
      
      const response = await this.makeRequest('GET', endpoint);
      const endTime = performance.now();
      
      CartLogger.debug('GetCart', `Request completed in ${endTime - startTime}ms`);
      
      if (!response.ok) {
        throw new CartAPIError(
          `Failed to get cart: ${response.status}`,
          response.status,
          endpoint
        );
      }

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
      
      CartLogger.info('GetCart', 'Cart retrieved successfully:', {
        itemCount: cartResponse.item_count,
        totalPrice: cartResponse.total_price
      });
      
      return cartResponse;
    } catch (error) {
      const endTime = performance.now();
      CartLogger.error('GetCart', 'Failed to get cart:', {
        error: error instanceof Error ? error.message : String(error),
        duration: `${endTime - startTime}ms`
      });
      throw error;
    }
  }
  
  private static validateInputs(variantId: string, quantity: number): boolean {
    if (!variantId || isNaN(Number.parseInt(variantId))) {
      CartLogger.error('Validation', 'Invalid variant ID:', variantId);
      return false;
    }
    
    if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
      CartLogger.error('Validation', 'Invalid quantity:', quantity);
      return false;
    }
    
    CartLogger.debug('Validation', 'Input validation passed');
    return true;
  }
  
  private static async makeRequest(
    method: 'GET' | 'POST',
    url: string,
    body?: any
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
          // Fix: Add referer header for Shopify API compliance
          'Referer': window.location.href
        },
        signal: controller.signal,
        // Fix: Add credentials for proper cookie handling
        credentials: 'same-origin'
      };
      
      if (body && method === 'POST') {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, options);
      clearTimeout(timeoutId);
      
      // Fix: Better error handling
      if (response.status === 405) {
        CartLogger.error('API', 'Method not allowed - check endpoint configuration:', url);
        throw new CartAPIError(
          `Method not allowed for endpoint: ${url}. Verify the store URL and endpoint path.`,
          response.status,
          url
        );
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new CartAPIError('Request timed out');
      }
      throw error;
    }
  }

  static formatPrice(price: number, currency = "USD"): string {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(price / 100) // Shopify prices are in cents
    } catch (error) {
      CartLogger.warn('FormatPrice', 'Failed to format price, using fallback:', {
        price,
        currency,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback formatting
      return `$${(price / 100).toFixed(2)}`;
    }
  }

  static navigateToCart(): void {
    try {
      CartLogger.info('Navigation', 'Navigating to cart page');
      window.location.href = "/cart";
    } catch (error) {
      CartLogger.error('Navigation', 'Failed to navigate to cart:', error);
    }
  }

  static navigateToCheckout(): void {
    try {
      CartLogger.info('Navigation', 'Navigating to checkout page');
      window.location.href = "/checkout";
    } catch (error) {
      CartLogger.error('Navigation', 'Failed to navigate to checkout:', error);
    }
  }
  
  // Utility method to get cart metrics for debugging
  static async getCartMetrics(): Promise<{
    itemCount: number;
    totalValue: number;
    currency: string;
    lastUpdated: string;
  }> {
    try {
      const cart = await this.getCart();
      return {
        itemCount: cart.item_count,
        totalValue: cart.total_price,
        currency: cart.currency,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      CartLogger.error('Metrics', 'Failed to get cart metrics:', error);
      throw error;
    }
  }
  
  // Method to clear cart (if supported by store)
  static async clearCart(): Promise<void> {
    try {
      const storeURL = StoreURLHelper.detectStoreURL();
      const endpoint = `${storeURL}/cart/clear.js`;
      
      CartLogger.info('ClearCart', 'Clearing cart via:', endpoint);
      
      const response = await this.makeRequest('POST', endpoint);
      
      if (!response.ok) {
        throw new CartAPIError(
          `Failed to clear cart: ${response.status}`,
          response.status,
          endpoint
        );
      }
      
      CartLogger.info('ClearCart', 'Cart cleared successfully');
    } catch (error) {
      CartLogger.error('ClearCart', 'Failed to clear cart:', error);
      throw error;
    }
  }
}
