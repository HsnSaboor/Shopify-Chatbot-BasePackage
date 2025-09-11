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

export class ShopifyCartService {
  static async addToCart(variantId: string, quantity = 1): Promise<CartResponse> {
    try {
      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              id: Number.parseInt(variantId),
              quantity: quantity,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to add to cart: ${response.status}`)
      }

      // Get updated cart after adding item
      return await this.getCart()
    } catch (error) {
      console.error("Error adding to cart:", error)
      throw error
    }
  }

  static async getCart(): Promise<CartResponse> {
    try {
      const response = await fetch("/cart.js")

      if (!response.ok) {
        throw new Error(`Failed to get cart: ${response.status}`)
      }

      const cart = await response.json()

      return {
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
      }
    } catch (error) {
      console.error("Error getting cart:", error)
      throw error
    }
  }

  static formatPrice(price: number, currency = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price / 100) // Shopify prices are in cents
  }

  static navigateToCart(): void {
    window.location.href = "/cart"
  }

  static navigateToCheckout(): void {
    window.location.href = "/checkout"
  }
}
