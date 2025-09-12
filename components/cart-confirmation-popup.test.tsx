import { render, screen, fireEvent } from '@testing-library/react';
import { CartConfirmationPopup } from './cart-confirmation-popup';
import { createCartPopupHTML } from './cart-confirmation-popup';

// Mock the ShopifyCartService
jest.mock('@/lib/shopify-cart', () => ({
  ShopifyCartService: {
    formatPrice: jest.fn().mockImplementation((price) => `$${(price / 100).toFixed(2)}`),
    navigateToCart: jest.fn(),
    navigateToCheckout: jest.fn()
  }
}));

describe('CartConfirmationPopup', () => {
  const mockCart = {
    items: [
      { id: '1', variantId: '1', quantity: 1, name: 'Test Product', price: '$10.00', image: '' }
    ],
    total_price: 1000,
    item_count: 1,
    currency: 'USD'
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(
      <CartConfirmationPopup 
        isOpen={true} 
        onClose={mockOnClose} 
        cart={mockCart} 
      />
    );

    expect(screen.getByText('Added to Cart!')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <CartConfirmationPopup 
        isOpen={false} 
        onClose={mockOnClose} 
        cart={mockCart} 
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <CartConfirmationPopup 
        isOpen={true} 
        onClose={mockOnClose} 
        cart={mockCart} 
      />
    );

    const closeButton = screen.getByText('Close').closest('button');
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('formats cart items correctly', () => {
    const cartWithMultipleItems = {
      ...mockCart,
      items: [
        { id: '1', variantId: '1', quantity: 1, name: 'Product 1', price: '$10.00', image: '' },
        { id: '2', variantId: '2', quantity: 2, name: 'Product 2', price: '$20.00', image: '' },
        { id: '3', variantId: '3', quantity: 1, name: 'Product 3', price: '$15.00', image: '' },
        { id: '4', variantId: '4', quantity: 3, name: 'Product 4', price: '$5.00', image: '' }
      ],
      item_count: 4
    };

    render(
      <CartConfirmationPopup 
        isOpen={true} 
        onClose={mockOnClose} 
        cart={cartWithMultipleItems} 
      />
    );

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Product 3')).toBeInTheDocument();
    expect(screen.getByText('+1 more items')).toBeInTheDocument();
  });
});

describe('createCartPopupHTML', () => {
  const mockCart = {
    items: [
      { id: '1', variantId: '1', quantity: 1, name: 'Test Product', price: '$10.00', image: '' }
    ],
    total_price: 1000,
    item_count: 1,
    currency: 'USD'
  };

  it('generates correct HTML structure', () => {
    const html = createCartPopupHTML(mockCart);
    
    // Check that the HTML contains key elements
    expect(html).toContain('Added to Cart!');
    expect(html).toContain('Test Product');
    expect(html).toContain('$10.00');
    expect(html).toContain('Total:');
    expect(html).toContain('View Cart');
    expect(html).toContain('Checkout');
    expect(html).toContain('Close');
    
    // Check that it uses CSS classes instead of inline styles
    expect(html).toContain('class="bg-white rounded-xl shadow-lg overflow-hidden"');
    expect(html).toContain('class="flex-1 inline-flex items-center justify-center"');
  });

  it('formats multiple items correctly', () => {
    const cartWithMultipleItems = {
      ...mockCart,
      items: [
        { id: '1', variantId: '1', quantity: 1, name: 'Product 1', price: '$10.00', image: '' },
        { id: '2', variantId: '2', quantity: 2, name: 'Product 2', price: '$20.00', image: '' },
        { id: '3', variantId: '3', quantity: 1, name: 'Product 3', price: '$15.00', image: '' },
        { id: '4', variantId: '4', quantity: 3, name: 'Product 4', price: '$5.00', image: '' }
      ],
      item_count: 4
    };

    const html = createCartPopupHTML(cartWithMultipleItems);
    
    expect(html).toContain('Product 1');
    expect(html).toContain('Product 2');
    expect(html).toContain('Product 3');
    expect(html).toContain('+1 more items');
  });

  it('handles empty cart correctly', () => {
    const emptyCart = {
      items: [],
      total_price: 0,
      item_count: 0,
      currency: 'USD'
    };

    const html = createCartPopupHTML(emptyCart);
    
    expect(html).toContain('No items in cart');
  });
});