"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useProductPricing } from "@/hooks/use-product-pricing"
import { addToCart } from "@/lib/product-cart"
import { ImageGallery } from "../components/product-card/ImageGallery"

import { ShopifyCartService, type CartResponse } from "@/lib/shopify-cart"

// Simple icon components
const ExternalLinkIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
)

const ShoppingCartIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L23 6H6" />
  </svg>
)

const CheckIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 12 2 2 4-4" />
  </svg>
)

interface ProductCardProps {
  product: {
    id: string
    variantId?: string
    name?: string
    title?: string
    image?: string
    image_url?: string // Added support for webhook image_url field
    images?: string[] // Added support for webhook images array
    price: string | number
    compareAtPrice?: string | number
    url?: string
    product_url?: string // Added support for webhook product_url field
    variants?: Array<{
      size?: string
      color?: string
      variantId?: string
      variant_id?: string // Added support for webhook variant_id field
      variant_title?: string // Added support for webhook variant_title field
      options?: string[] // Added support for webhook options array
      id?: string
      name?: string
      type?: string
      value?: string
      price?: string // Added support for variant-level pricing
      compareAtPrice?: string // Added support for variant-level compare at price
    }>
  }
  currency?: string
  onAddToCart?: (cart: CartResponse) => void
  accentColor?: string
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export function ProductCard({ product, currency, onAddToCart, accentColor = "#4f46e5", isFullscreen = false, onToggleFullscreen }: ProductCardProps) {
  const productName = product.name || product.title || "Product"

  let galleryImages: string[] = [];
  if (product.image) {
    galleryImages.push(product.image);
  }
  if (product.images && Array.isArray(product.images)) {
    const additional = product.images.filter((img) => img !== product.image);
    galleryImages.push(...additional);
  }
  if (product.image_url && !galleryImages.includes(product.image_url)) {
    galleryImages.push(product.image_url);
  }
  const finalGalleryImages = galleryImages.length > 0 ? galleryImages : ["/placeholder.svg"];

  const productUrl = product.product_url || product.url || "#"

  const [selectedVariant, setSelectedVariant] = useState(
    product.variantId || product.variants?.[0]?.variantId || product.variants?.[0]?.variant_id || "",
  )
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { toast } = useToast()
  
  const { productPrice, compareAtPrice } = useProductPricing(product, selectedVariant, currency)

  const processVariants = () => {
    if (!product.variants) return { colors: [], sizes: [] }

    console.log('[ProductCard] Processing variants:', product.variants)

    const colors: Array<{ name: string; value: string; id: string }> = []
    const sizes: Array<{ name: string; value: string; id: string }> = []

    // Size order mapping for proper sorting
    const sizeOrder: { [key: string]: number } = {
      'XXS': 1, 'XS': 2, 'S': 3, 'M': 4, 'L': 5, 'XL': 6, '2XL': 7, 'XXL': 7, '3XL': 8, 'XXXL': 9
    }

    product.variants.forEach((variant) => {
      let variantColor = variant.color || '';
      let variantSize = variant.size || '';
      let variantTitle = variant.variant_title || variant.name || '';
      if (!variantColor && !variantSize && variantTitle.includes('/')) {
        const parts = variantTitle.split('/').map(p => p.trim());
        if (parts.length >= 2) {
          variantColor = parts[0];
          variantSize = parts[1];
        }
      }

      // If size contains color, split it more robustly
      if (variantSize && (variantSize.includes('/') || variantSize.includes(' / '))) {
        // Split on / with optional spaces
        const parts = variantSize.split('/').map(p => p.trim());
        if (parts.length >= 2) {
          variantColor = parts[0];
          variantSize = parts[1];
        }
      }

      const variantId = variant.variant_id || variant.variantId || ""

      // Add color if present and not empty
      if (variantColor && variantColor.trim()) {
        console.log('[ProductCard] Found color:', variantColor, 'for variant:', variantId)
        const existing = colors.find((c) => c.name.toLowerCase() === variantColor.toLowerCase().trim())
        if (!existing) {
          colors.push({
            name: variantColor.trim(),
            value: variantColor.toLowerCase().includes("white")
              ? "#FFFFFF"
              : variantColor.toLowerCase().includes("black")
                ? "#000000"
                : variantColor.toLowerCase().includes("blue")
                  ? "#3B82F6"
                  : variantColor.toLowerCase().includes("red")
                    ? "#EF4444"
                    : variantColor.toLowerCase().includes("green")
                      ? "#10B981"
                      : variantColor.toLowerCase().includes("yellow")
                        ? "#F59E0B"
                        : variantColor.toLowerCase().includes("purple")
                          ? "#8B5CF6"
                          : variantColor.toLowerCase().includes("pink")
                            ? "#EC4899"
                            : variantColor.toLowerCase().includes("gray")
                              ? "#6B7280"
                              : variantColor.toLowerCase().includes("navy")
                                ? "#1E3A8A"
                                : "#6B7280",
            id: variantId,
          })
        }
      }

      // Add size if present and valid
      if (variantSize && variantSize.trim()) {
        console.log('[ProductCard] Found size:', variantSize, 'for variant:', variantId)
        const cleanSize = variantSize.trim()
        // Check if it's a valid size
        if (/^(XXS|XS|S|M|L|XL|2XL|3XL|XXL|XXXL|\d+XL?|\d+)$/i.test(cleanSize)) {
          const existing = sizes.find((s) => s.name.toLowerCase() === cleanSize.toLowerCase())
          if (!existing) {
            sizes.push({
              name: cleanSize,
              value: cleanSize,
              id: variantId,
            })
          }
        }
      }

      // Fallback to options if no color/size found
      if (variant.options && variant.options.length > 0) {
        variant.options.forEach(option => {
          const cleanOption = option.trim()
          if (!variantColor && !variantSize) {
            // Check if it's a size
            if (/^(XXS|XS|S|M|L|XL|2XL|3XL|XXL|XXXL|\d+XL?|\d+)$/i.test(cleanOption)) {
              console.log('[ProductCard] Found size from options:', cleanOption, 'for variant:', variantId)
              const existing = sizes.find((s) => s.name.toLowerCase() === cleanOption.toLowerCase())
              if (!existing) {
                sizes.push({
                  name: cleanOption,
                  value: cleanOption,
                  id: variantId,
                })
              }
            } else {
              // Treat as color
              console.log('[ProductCard] Found color from options:', cleanOption, 'for variant:', variantId)
              const existing = colors.find((c) => c.name.toLowerCase() === cleanOption.toLowerCase())
              if (!existing) {
                colors.push({
                  name: cleanOption,
                  value: cleanOption.toLowerCase().includes("white")
                    ? "#FFFFFF"
                    : cleanOption.toLowerCase().includes("black")
                      ? "#000000"
                      : cleanOption.toLowerCase().includes("blue")
                        ? "#3B82F6"
                        : cleanOption.toLowerCase().includes("red")
                          ? "#EF4444"
                          : cleanOption.toLowerCase().includes("green")
                            ? "#10B981"
                            : cleanOption.toLowerCase().includes("yellow")
                              ? "#F59E0B"
                              : cleanOption.toLowerCase().includes("purple")
                                ? "#8B5CF6"
                                : cleanOption.toLowerCase().includes("pink")
                                  ? "#EC4899"
                                  : cleanOption.toLowerCase().includes("gray")
                                    ? "#6B7280"
                                    : cleanOption.toLowerCase().includes("navy")
                                      ? "#1E3A8A"
                                      : "#6B7280",
                  id: variantId,
                })
              }
            }
          }
        })
      }

      // Handle new format with type property
      else if (variant.type === "color" && variant.value && variant.name) {
        const existing = colors.find((c) => c.value === variant.value)
        if (!existing) {
          colors.push({
            name: variant.name,
            value: variant.value,
            id: variant.id || variant.variantId || variant.variant_id || "",
          })
        }
      } else if (variant.type === "size" && variant.value && variant.name) {
        const existing = sizes.find((s) => s.value === variant.value)
        if (!existing) {
          sizes.push({
            name: variant.name,
            value: variant.value,
            id: variant.id || variant.variantId || variant.variant_id || "",
          })
        }
      }
      // Handle old format with color/size properties
      else if (variant.color) {
        const existing = colors.find((c) => c.name === variant.color)
        if (!existing) {
          colors.push({
            name: variant.color,
            value: variant.color.toLowerCase().includes("white")
              ? "#FFFFFF"
              : variant.color.toLowerCase().includes("black")
                ? "#000000"
                : variant.color.toLowerCase().includes("blue")
                  ? "#3B82F6"
                  : variant.color.toLowerCase().includes("red")
                    ? "#EF4444"
                    : variant.color.toLowerCase().includes("green")
                      ? "#10B981"
                      : variant.color.toLowerCase().includes("yellow")
                        ? "#F59E0B"
                        : variant.color.toLowerCase().includes("purple")
                          ? "#8B5CF6"
                          : variant.color.toLowerCase().includes("pink")
                            ? "#EC4899"
                            : variant.color.toLowerCase().includes("gray")
                              ? "#6B7280"
                              : variant.color.toLowerCase().includes("navy")
                                ? "#1E3A8A"
                                : "#6B7280",
            id: variant.variantId || variant.variant_id || "",
          })
        }
      }

      if (variant.size) {
        const existing = sizes.find((s) => s.name === variant.size)
        if (!existing) {
          sizes.push({
            name: variant.size,
            value: variant.size,
            id: variant.id || variant.variantId || variant.variant_id || "",
          })
        }
      }
    })

    // Sort sizes according to standard order
    sizes.sort((a, b) => {
      const orderA = sizeOrder[a.name.toUpperCase()] || 999
      const orderB = sizeOrder[b.name.toUpperCase()] || 999
      return orderA - orderB
    })

    console.log('[ProductCard] Final processed colors:', colors)
    console.log('[ProductCard] Final processed sizes:', sizes)

    return { colors, sizes }
  }

  const { colors, sizes } = processVariants()

  const requiresColorSelection = colors.length > 1
  const requiresSizeSelection = sizes.length > 0
  const isVariantSelected = (!requiresColorSelection || !!selectedColor) && (!requiresSizeSelection || !!selectedSize)

  // Auto-select color if there's only one option
  useEffect(() => {
    if (colors.length === 1 && !selectedColor) {
      setSelectedColor(colors[0].name)
      // Find matching variant
      const matchingVariant = product.variants?.find(
        (v) =>
          (v.type === "color" && v.name === colors[0].name) ||
          v.color === colors[0].name ||
          v.variant_id === colors[0].id ||
          v.variantId === colors[0].id,
      )
      if (matchingVariant) {
        setSelectedVariant(matchingVariant.variantId || matchingVariant.variant_id || "")
      }
    }
  }, [selectedColor, product.variants])

  const handleAddToCart = async () => {
    if (!isVariantSelected) {
      toast({
        variant: "destructive",
        title: "Selection Required",
        description: (
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Please select a variant / size / color first.
          </div>
        ),
      })
      return
    }

    setIsAddingToCart(true)
    try {
      await addToCart({
        product,
        selectedVariant,
        selectedColor,
        selectedSize,
        colors,
        quantity,
        toast,
        onAddToCart
      })
    } catch (error) {
      // Error handled by toast in addToCart
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleViewProduct = () => {
    window.open(productUrl, "_blank")
  }

  const handleColorSelect = (colorId: string, colorName: string) => {
    setSelectedColor(colorName)
    // Find matching variant
    const matchingVariant = product.variants?.find(
      (v) =>
        (v.type === "color" && v.id === colorId) ||
        v.color === colorName ||
        v.variant_id === colorId ||
        v.variantId === colorId,
    )
    if (matchingVariant) {
      setSelectedVariant(matchingVariant.variantId || matchingVariant.variant_id || "")
    }
  }

  const handleSizeSelect = (sizeId: string, sizeName: string) => {
    setSelectedSize(sizeName)
    // Find matching variant
    const matchingVariant = product.variants?.find((v) => {
      if (colors.length === 1) {
        const title = v.variant_title || v.name || '';
        const parts = title.split('/').map(p => p.trim());
        return parts.length >= 2 && parts[0] === selectedColor && parts[1] === sizeName;
      } else {
        return (v.type === "size" && v.id === sizeId) ||
               v.size === sizeName ||
               v.variant_id === sizeId ||
               v.variantId === sizeId ||
               (v.options && v.options.includes(sizeName));
      }
    })
    if (matchingVariant) {
      setSelectedVariant(matchingVariant.variantId || matchingVariant.variant_id || "")
    }
  }

  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-all duration-200 border-gray-200">
      <CardContent className="p-4">
        <div className="space-y-3 mb-4">
          <ImageGallery
            galleryImages={finalGalleryImages}
            productName={productName}
            compareAtPrice={compareAtPrice}
            isFullscreen={isFullscreen}
            onToggleFullscreen={onToggleFullscreen}
          />
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm line-clamp-2 text-gray-900 mb-2">{productName}</h4>
            <div className="flex flex-col items-start gap-1">
              {compareAtPrice && <p className="text-sm text-gray-500 line-through">{compareAtPrice}</p>}
              <p className="text-lg font-bold" style={{ color: accentColor }}>{productPrice}</p>
            </div>
          </div>

          {colors.length > 1 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Color</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleColorSelect(color.id, color.name)}
                    className={cn(
                      "relative w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110",
                      selectedColor === color.name
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-300 hover:border-gray-400",
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {selectedColor === color.name && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CheckIcon />
                      </div>
                    )}
                    {/* White border for light colors */}
                    {(color.value === "#FFFFFF" || color.value.toLowerCase() === "white") && (
                      <div className="absolute inset-0 rounded-full border border-gray-200" />
                    )}
                  </button>
                ))}
              </div>
              {selectedColor && <p className="text-xs text-gray-600">Selected: {selectedColor}</p>}
            </div>
          )}

          {sizes.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Size</Label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => handleSizeSelect(size.id, size.name)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 hover:scale-105",
                      selectedSize === size.name
                        ? "text-white border"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                    )}
                    style={selectedSize === size.name ? {
                      backgroundColor: accentColor,
                      borderColor: accentColor
                    } : {}}
                  >
                    {size.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-8 w-8 p-0"
              >
                -
              </Button>
              <Input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                className="h-8 text-xs text-center w-16"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                disabled={quantity >= 10}
                className="h-8 w-8 p-0"
              >
                +
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAddToCart}
              size="sm"
              className={cn(
                "flex-1 text-white shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden",
                !isVariantSelected && !isAddingToCart && "cursor-not-allowed"
              )}
              disabled={isAddingToCart || !isVariantSelected}
              style={{ backgroundColor: accentColor }}
            >
              <div className="relative z-10 flex items-center">
                <ShoppingCartIcon />
                <span className="ml-1">{isAddingToCart ? "Adding..." : "Add to Cart"}</span>
              </div>
              {!isVariantSelected && !isAddingToCart && (
                <div className="absolute inset-0 bg-gray-400/50 z-0 pointer-events-none" />
              )}
            </Button>
            <Button
              onClick={handleViewProduct}
              variant="outline"
              size="sm"
              className="hover:bg-gray-50 transition-colors duration-200 bg-transparent"
              title="View product details"
            >
              <ExternalLinkIcon />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
