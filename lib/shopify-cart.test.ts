/**
 * Test file for Shopify Cart Service
 * This file tests the functionality of the ShopifyCartService class
 */

import { ShopifyCartService, type CartItem, type CartResponse } from './shopify-cart';

// Mock window and postMessage for testing
const mockPostMessage = jest.fn();
const mockAddEventListener = jest.fn();

// Mock the global window object
Object.defineProperty(global, 'window', {
  value: {
    parent: {
      postMessage: mockPostMessage,
    },
    addEventListener: mockAddEventListener,
  },
  writable: true,
});

describe('ShopifyCartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showCartPopup', () => {
    it('should send SHOW_CART_POPUP message to parent window', () => {
      const mockCart: CartResponse = {
        items: [
          {
            id: '1',
            variantId: '1',
            quantity: 1,
            name: 'Test Product',
            price: '$10.00',
            image: 'test.jpg',
          },
        ],
        total_price: 1000,
        item_count: 1,
        currency: 'USD',
      };

      ShopifyCartService.showCartPopup(mockCart);

      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'SHOW_CART_POPUP', cart: mockCart },
        '*'
      );
    });

    it('should not send message when window is undefined', () => {
      // Save original window
      const originalWindow = global.window;
      
      // Remove window for this test
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      });

      const mockCart: CartResponse = {
        items: [],
        total_price: 0,
        item_count: 0,
        currency: 'USD',
      };

      // This should not throw an error
      expect(() => {
        ShopifyCartService.showCartPopup(mockCart);
      }).not.toThrow();

      // Restore window
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
      });
    });
  });

  describe('navigateToCart', () => {
    it('should send NAVIGATE_TO_CART message to parent window', () => {
      ShopifyCartService.navigateToCart();

      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'NAVIGATE_TO_CART' },
        '*'
      );
    });
  });

  describe('navigateToCheckout', () => {
    it('should send NAVIGATE_TO_CHECKOUT message to parent window', () => {
      ShopifyCartService.navigateToCheckout();

      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'NAVIGATE_TO_CHECKOUT' },
        '*'
      );
    });
  });

  describe('formatPrice', () => {
    it('should format price correctly', () => {
      const formatted = ShopifyCartService.formatPrice(1000, 'USD');
      expect(formatted).toBe('$10.00');
    });

    it('should handle fallback formatting when Intl fails', () => {
      // Mock Intl.NumberFormat to throw an error
      const originalNumberFormat = Intl.NumberFormat;
      Intl.NumberFormat = jest.fn(() => {
        throw new Error('Intl not available');
      });

      const formatted = ShopifyCartService.formatPrice(1000, 'USD');
      expect(formatted).toBe('$10.00');

      // Restore original
      Intl.NumberFormat = originalNumberFormat;
    });
  });
});