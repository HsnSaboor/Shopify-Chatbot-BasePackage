import { useMemo } from "react"

interface ProductVariant {
  variant_id?: string
  variantId?: string
  price?: string | number
  compareAtPrice?: string | number
  color?: string
  size?: string
  variant_title?: string
  name?: string
  options?: string[]
  type?: string
  value?: string
  id?: string
}

interface Product {
  id: string
  variantId?: string
  name?: string
  title?: string
  image?: string
  image_url?: string
  images?: string[]
  price: string | number
  compareAtPrice?: string | number
  url?: string
  product_url?: string
  variants?: ProductVariant[]
}

export function useProductPricing(product: Product, selectedVariant: string) {
  const hasDecimals = useMemo(() => {
    const prices: number[] = [parseFloat(String(product.price))]
    if (product.compareAtPrice) {
      prices.push(parseFloat(String(product.compareAtPrice)))
    }
    if (product.variants) {
      product.variants.forEach((variant) => {
        if (variant.price) {
          prices.push(parseFloat(String(variant.price)))
        }
        if (variant.compareAtPrice) {
          prices.push(parseFloat(String(variant.compareAtPrice)))
        }
      })
    }
    return prices.some((p) => !isNaN(p) && p % 1 !== 0)
  }, [product])

  const formatPrice = (price: string | number) => {
    const num = parseFloat(String(price))
    if (isNaN(num)) return "$0"
    const options: Intl.NumberFormatOptions = {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0,
    }
    return new Intl.NumberFormat("en-US", options).format(num)
  }

  const getCurrentVariantPricing = () => {
    if (selectedVariant && product.variants) {
      const variant = product.variants.find(
        (v) => v.variant_id === selectedVariant || v.variantId === selectedVariant
      )
      if (variant?.price) {
        const resolvedCompareAtPrice = (variant.compareAtPrice == null || variant.compareAtPrice === '')
          ? product.compareAtPrice
          : variant.compareAtPrice
        return {
          price: variant.price,
          compareAtPrice: resolvedCompareAtPrice || null
        }
      }
    }
    // Fallback to product level pricing
    return {
      price: product.price,
      compareAtPrice: product.compareAtPrice || null
    }
  }

  const { price: currentPrice, compareAtPrice: currentCompareAtPrice } = getCurrentVariantPricing()

  const productPrice = formatPrice(currentPrice)
  const rawCompareAtPrice = currentCompareAtPrice
  const shouldShowCompareAtPrice = rawCompareAtPrice && parseFloat(String(rawCompareAtPrice)) > parseFloat(String(currentPrice))
  const compareAtPrice = shouldShowCompareAtPrice ? formatPrice(rawCompareAtPrice) : null

  return {
    productPrice,
    compareAtPrice,
    hasDecimals,
    formatPrice,
    getCurrentVariantPricing
  }
}