import { ShopifyCartService, type CartResponse } from "./shopify-cart"

interface ProductVariant {
  variant_id?: string
  variantId?: string
  variant_title?: string
  name?: string
  color?: string
  size?: string
  options?: string[]
}

interface Product {
  variants?: ProductVariant[]
  name?: string
  title?: string
}

interface AddToCartOptions {
  product: Product
  selectedVariant: string
  selectedColor: string
  selectedSize: string
  quantity: number
  colors?: Array<{ name: string; value: string; id: string }>
  toast: any // From useToast
  onAddToCart?: (cart: CartResponse) => void
}

export async function addToCart(options: AddToCartOptions): Promise<CartResponse> {
  const { product, selectedVariant, selectedColor, selectedSize, colors, quantity, toast, onAddToCart } = options

  const productName = product.name || product.title || "Product"

  try {
    let effectiveVariantId = selectedVariant
    if (!effectiveVariantId && colors?.length === 1 && selectedSize && product.variants) {
      const matchingVariant = product.variants.find((v) => {
        const title = (v.variant_title || v.name || '').trim()
        const parts = title.split('/').map((p) => p.trim())
        return parts.length >= 2 && parts[0] === selectedColor && parts[1] === selectedSize
      })
      if (matchingVariant) {
        effectiveVariantId = matchingVariant.variant_id || matchingVariant.variantId || ''
      }
    }
    if (!effectiveVariantId && product.variants && product.variants.length > 0) {
      effectiveVariantId = product.variants[0].variant_id || product.variants[0].variantId || ''
    }

    const cart = await ShopifyCartService.addToCart(effectiveVariantId, quantity)

    toast({
      title: "Added to Cart!",
      description: `${productName} has been added to your cart.`,
    })

    onAddToCart?.(cart)

    return cart
  } catch (error) {
    console.error("Failed to add to cart:", error)
    toast({
      title: "Error",
      description: "Failed to add item to cart. Please try again.",
      variant: "destructive",
    })
    throw error
  }
}