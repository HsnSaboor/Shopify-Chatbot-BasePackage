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
  
  static async addToCart(variantId: string, quantity = 1): Promise<any> {
    return this.sendMessage('CART_ADD_ITEM', { variantId, quantity });
  }
  
  static async getCart(): Promise<CartResponse> {
    return this.sendMessage('CART_GET');
  }
  
  static navigateToCart(): void {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      window.location.href = "/cart";
    } catch (error) {
      console.error('Failed to navigate to cart:', error);
    }
  }

  static navigateToCheckout(): void {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      window.location.href = "/checkout";
    } catch (error) {
      console.error('Failed to navigate to checkout:', error);
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
      // Handle responses
      if (event.data.id && this.pendingRequests.has(event.data.id)) {
        const { resolve, reject } = this.pendingRequests.get(event.data.id);
        this.pendingRequests.delete(event.data.id);
        
        if (event.data.success) {
          resolve(event.data.data);
        } else {
          reject(new Error(event.data.error));
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