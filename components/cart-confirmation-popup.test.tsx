/**
 * Test file for Cart Confirmation Popup
 * This file tests the functionality of the CartConfirmationPopup component
 */

import { createCartPopupHTML } from './cart-confirmation-popup';
import { ShopifyCartService } from '@/lib/shopify-cart';

// Mock the ShopifyCartService.formatPrice method
jest.mock('@/lib/shopify-cart', () => ({
  ShopifyCartService: {
    formatPrice: jest.fn((price: number, currency: string) => `$${(price / 100).toFixed(2)}`),
  },
}));

describe('CartConfirmationPopup', () => {
  describe('createCartPopupHTML', () => {
    it('should generate correct HTML for cart with items', () => {
      const mockCart = {
        items: [
          {
            id: '1',
            variantId: '1',
            quantity: 1,
            name: 'Test Product',
            price: '$10.00',
            image: 'test.jpg',
          },
          {
            id: '2',
            variantId: '2',
            quantity: 2,
            name: 'Another Product',
            price: '$20.00',
            image: 'test2.jpg',
          },
        ],
        total_price: 5000,
        item_count: 2,
        currency: 'USD',
      };

      const html = createCartPopupHTML(mockCart);
      
      // Check that the HTML contains expected elements
      expect(html).toContain('Added to Cart!');
      expect(html).toContain('Test Product');
      expect(html).toContain('Another Product');
      expect(html).toContain('2 items');
      expect(html).toContain('$50.00'); // Total price
      expect(html).toContain('View Cart');
      expect(html).toContain('Checkout');
    });

    it('should handle cart with no items', () => {
      const mockCart = {
        items: [],
        total_price: 0,
        item_count: 0,
        currency: 'USD',
      };

      const html = createCartPopupHTML(mockCart);
      
      // Check that the HTML contains expected elements for empty cart
      expect(html).toContain('Added to Cart!');
      expect(html).toContain('No items in cart');
      expect(html).toContain('0 items');
      expect(html).toContain('$0.00'); // Total price
    });

    it('should handle cart with many items (truncate with + more)', () => {
      const mockCart = {
        items: Array(5).fill(null).map((_, i) => ({
          id: `${i + 1}`,
          variantId: `${i + 1}`,
          quantity: 1,
          name: `Product ${i + 1}`,
          price: `$${(i + 1) * 10}.00`,
          image: `test${i + 1}.jpg`,
        })),
        total_price: 15000,
        item_count: 5,
        currency: 'USD',
      };

      const html = createCartPopupHTML(mockCart);
      
      // Check that only first 3 items are shown and "+2 more items" is displayed
      expect(html).toContain('Product 1');
      expect(html).toContain('Product 2');
      expect(html).toContain('Product 3');
      expect(html).toContain('+2 more items');
      expect(html).toContain('5 items');
    });
  });
});