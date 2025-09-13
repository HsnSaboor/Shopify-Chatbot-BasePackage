/**
 * Minimal Shopify Cart Service
 * TypeScript service for cart operations in iframe
 */

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

export class ShopifyCartService {
  private static messageId = 0;
  private static pendingRequests = new Map();
  
  static async addToCart(variantId: string, quantity = 1): Promise<CartResponse> {
    try {
      console.log('[ShopifyCartService] Adding item to cart:', { variantId, quantity });
      const result = await this.sendMessage('CART_ADD_ITEM', { variantId, quantity });
      console.log('[ShopifyCartService] Received cart response:', result);
      
      // Ensure result has proper cart structure
      if (!result || typeof result !== 'object') {
        console.warn('[ShopifyCartService] Invalid cart response, using default structure');
        return this.getDefaultCartResponse();
      }
      
      // Normalize cart structure
      const normalizedCart: CartResponse = {
        items: Array.isArray(result.items) ? result.items : [],
        total_price: result.total_price || 0,
        item_count: result.item_count || 0,
        currency: result.currency || 'USD'
      };
      
      console.log('[ShopifyCartService] Normalized cart response:', normalizedCart);
      
      return normalizedCart;
    } catch (error) {
      console.error('[ShopifyCartService] Failed to add to cart:', error);
      // Return a safe default cart structure
      return this.getDefaultCartResponse();
    }
  }
  
  // Helper method for default cart response
  private static getDefaultCartResponse(): CartResponse {
    return {
      items: [],
      total_price: 0,
      item_count: 0,
      currency: 'USD'
    };
  }
  
  static async getCart(): Promise<CartResponse> {
    try {
      const result = await this.sendMessage('CART_GET');
      
      // Ensure result has proper cart structure
      if (!result || typeof result !== 'object') {
        console.warn('[ShopifyCartService] Invalid cart response, using default structure');
        return this.getDefaultCartResponse();
      }
      
      // Normalize cart structure
      const normalizedCart: CartResponse = {
        items: Array.isArray(result.items) ? result.items : [],
        total_price: result.total_price || 0,
        item_count: result.item_count || 0,
        currency: result.currency || 'USD'
      };
      
      return normalizedCart;
    } catch (error) {
      console.error('[ShopifyCartService] Failed to get cart:', error);
      // Return a safe default cart structure
      return this.getDefaultCartResponse();
    }
  }
  
  static navigateToCart(): void {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Instead of direct navigation, send message to parent window
      window.parent.postMessage({ type: 'NAVIGATE_TO_CART' }, '*');
    } catch (error) {
      console.error('Failed to send navigate to cart message:', error);
    }
  }

  static navigateToCheckout(): void {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Instead of direct navigation, send message to parent window
      window.parent.postMessage({ type: 'NAVIGATE_TO_CHECKOUT' }, '*');
    } catch (error) {
      console.error('Failed to send navigate to checkout message:', error);
    }
  }
  
  static formatPrice(price: number, currency: string): string {
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
  
  private static sendMessage(type: string, payload?: any): Promise<any> {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Window not available'));
    }
    
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      
      // Store promise callbacks
      this.pendingRequests.set(id, { resolve, reject });
      
      // Send message to parent
      window.parent.postMessage({ type, payload, id }, '*');
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 5000);
    });
  }
  
  // Handle incoming messages
  static init() {
    window.addEventListener('message', (event) => {
      console.log('[ShopifyCartService] Received message:', event.data);
      // Handle responses
      if (event.data.id && this.pendingRequests.has(event.data.id)) {
        const { resolve, reject } = this.pendingRequests.get(event.data.id);
        this.pendingRequests.delete(event.data.id);
        
        if (event.data.success) {
          console.log('[ShopifyCartService] Successful response:', event.data.data);
          // Ensure cart data has proper structure
          const data = event.data.data || {};
          if (!data.items) {
            console.warn('[ShopifyCartService] Cart data missing items array, creating empty array');
            data.items = [];
          }
          resolve(data);
        } else {
          console.error('[ShopifyCartService] Error response:', event.data.error);
          reject(new Error(event.data.error || 'Unknown error'));
        }
      }
    });
  }
}

// Initialize message handler
// Only run on client-side
if (typeof window !== 'undefined') {
  ShopifyCartService.init();
}