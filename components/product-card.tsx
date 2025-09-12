"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { ShopifyCartService, type CartResponse } from "@/lib/shopify-cart"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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

const ChevronLeftIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
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
    compareAtPrice?: number
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
      weight?: string
    }>
  }
  onAddToCart?: (cart: CartResponse) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const productName = product.name || product.title || "Product"
  const productPrice = typeof product.price === "number" ? `$${(product.price / 100).toFixed(2)}` : product.price
  const compareAtPrice = product.compareAtPrice ? `$${(product.compareAtPrice / 100).toFixed(2)}` : null

  const galleryImages = []
  if (product.image_url || product.image) {
    galleryImages.push(product.image_url || product.image)
  }
  if (product.images && product.images.length > 0) {
    galleryImages.push(...product.images)
  }
  // Fallback to placeholder if no images
  if (galleryImages.length === 0) {
    galleryImages.push("/placeholder.svg")
  }

  const productUrl = product.product_url || product.url || "#"

  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const [selectedVariant, setSelectedVariant] = useState(
    product.variantId || product.variants?.[0]?.variantId || product.variants?.[0]?.variant_id || "",
  )
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { toast } = useToast()

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
  }

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

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
      if (variant.options && variant.options.length > 0) {
        const option = variant.options[0] // Assuming first option is size for now
        const variantId = variant.variant_id || variant.variantId || ""

        // Check if it's a size (S, M, L, XL, 2XL, etc.)
        if (/^(XXS|XS|S|M|L|XL|2XL|3XL|XXL|XXXL|\d+XL?|\d+)$/i.test(option)) {
          console.log('[ProductCard] Found size:', option, 'for variant:', variantId)
          const existing = sizes.find((s) => s.name === option)
          if (!existing) {
            sizes.push({
              name: option,
              value: option,
              id: variantId,
            })
          }
        }
        // Otherwise treat as color
        else {
          console.log('[ProductCard] Found color:', option, 'for variant:', variantId)
          const existing = colors.find((c) => c.name === option)
          if (!existing) {
            colors.push({
              name: option,
              value: option.toLowerCase().includes("white")
                ? "#FFFFFF"
                : option.toLowerCase().includes("black")
                  ? "#000000"
                  : option.toLowerCase().includes("blue")
                    ? "#3B82F6"
                    : option.toLowerCase().includes("red")
                      ? "#EF4444"
                      : option.toLowerCase().includes("green")
                        ? "#10B981"
                        : option.toLowerCase().includes("yellow")
                          ? "#F59E0B"
                          : option.toLowerCase().includes("purple")
                            ? "#8B5CF6"
                            : option.toLowerCase().includes("pink")
                              ? "#EC4899"
                              : option.toLowerCase().includes("gray")
                                ? "#6B7280"
                                : option.toLowerCase().includes("navy")
                                  ? "#1E3A8A"
                                  : "#6B7280",
              id: variantId,
            })
          }
        }
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

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    try {
      const cart = await ShopifyCartService.addToCart(selectedVariant, quantity)

      toast({
        title: "Added to Cart!",
        description: `${productName} has been added to your cart.`,
      })

      onAddToCart?.(cart)
    } catch (error) {
      console.error("Failed to add to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
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
    const matchingVariant = product.variants?.find(
      (v) =>
        (v.type === "size" && v.id === sizeId) ||
        v.size === sizeName ||
        v.variant_id === sizeId ||
        v.variantId === sizeId ||
        (v.options && v.options.includes(sizeName)),
    )
    if (matchingVariant) {
      setSelectedVariant(matchingVariant.variantId || matchingVariant.variant_id || "")
    }
  }

  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-all duration-200 border-gray-200">
      <CardContent className="p-4">
        <div className="space-y-3 mb-4">
          {/* Main image with navigation arrows */}
          <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-50 group">
            <Image
              src={galleryImages[currentImageIndex] || "/placeholder.svg"}
              alt={productName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {compareAtPrice && <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">Sale</Badge>}

            {/* Navigation arrows - only show if more than one image */}
            {galleryImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <ChevronRightIcon />
                </Button>
              </>
            )}

            {/* Image counter */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {currentImageIndex + 1} / {galleryImages.length}
              </div>
            )}
          </div>

          {/* Thumbnail navigation - only show if more than one image */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200",
                    currentImageIndex === index
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${productName} ${index + 1}`}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm line-clamp-2 text-gray-900 mb-2">{productName}</h4>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-blue-600">{productPrice}</p>
              {compareAtPrice && <p className="text-sm text-gray-500 line-through">{compareAtPrice}</p>}
            </div>
          </div>

          {colors.length > 0 && (
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
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                    )}
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
              disabled={isAddingToCart}
            >
              <ShoppingCartIcon />
              <span className="ml-1">{isAddingToCart ? "Adding..." : "Add to Cart"}</span>
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
