"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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

const MaximizeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
)

const XIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
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
  onAddToCart?: (cart: CartResponse) => void
  accentColor?: string
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export function ProductCard({ product, onAddToCart, accentColor = "#4f46e5", isFullscreen = false, onToggleFullscreen }: ProductCardProps) {
   const productName = product.name || product.title || "Product"
   // Format price with currency based on whether any price has decimals
   const formatPrice = (price: string | number) => {
     const num = parseFloat(String(price));
     if (isNaN(num)) return "$0";
     const options: Intl.NumberFormatOptions = {
       style: "currency",
       currency: "USD",
       minimumFractionDigits: hasDecimals ? 2 : 0,
       maximumFractionDigits: hasDecimals ? 2 : 0,
     };
     return new Intl.NumberFormat("en-US", options).format(num);
   }

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

  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const [selectedVariant, setSelectedVariant] = useState(
    product.variantId || product.variants?.[0]?.variantId || product.variants?.[0]?.variant_id || "",
  )
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { toast } = useToast()
  
    const [isFullScreenGallery, setIsFullScreenGallery] = useState(false)
    const [fullScreenIndex, setFullScreenIndex] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const [mainItemWidth, setMainItemWidth] = useState(0)
    const [thumbItemWidth, setThumbItemWidth] = useState(0)
  
    const touchRef = useRef({ startX: 0, deltaX: 0 })
    const thumbRef = useRef<HTMLDivElement>(null)
    const mainGalleryRef = useRef<HTMLDivElement>(null)
    const scrollerRef = useRef<HTMLDivElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const updateThumbWidth = () => {
        if (thumbRef.current && thumbRef.current.children.length > 0) {
          setThumbItemWidth((thumbRef.current.children[0] as HTMLElement)?.offsetWidth || 0)
        }
      }
      updateThumbWidth()
      window.addEventListener('resize', updateThumbWidth)
      return () => window.removeEventListener('resize', updateThumbWidth)
    }, [galleryImages.length])

    useEffect(() => {
      const updateMainWidth = () => {
        if (scrollerRef.current) {
          const firstContainer = scrollerRef.current.querySelector('.flex-shrink-0') as HTMLElement
          setMainItemWidth(firstContainer?.offsetWidth || 0)
        }
      }
      updateMainWidth()
      window.addEventListener('resize', updateMainWidth)
      return () => window.removeEventListener('resize', updateMainWidth)
    }, [galleryImages.length])
  
    useEffect(() => {
      const mediaQuery = window.matchMedia('(max-width: 768px)')
      setIsMobile(mediaQuery.matches)
      const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    // Ensure initial index on mount
    useEffect(() => {
      if (galleryImages.length > 0) {
        setCurrentImageIndex(0)
      }
    }, [galleryImages.length])

    // No continuous scroll listener or observer to prevent flicker during swipe; index updates on touchEnd/navigation (mirroring fullscreen discrete updates)


  const hasDecimals = useMemo(() => {
    const prices: number[] = [parseFloat(String(product.price))];
    if (product.compareAtPrice) {
      prices.push(parseFloat(String(product.compareAtPrice)));
    }
    if (product.variants) {
      product.variants.forEach((variant) => {
        if (variant.price) {
          prices.push(parseFloat(String(variant.price)));
        }
        if (variant.compareAtPrice) {
          prices.push(parseFloat(String(variant.compareAtPrice)));
        }
      });
    }
    return prices.some((p) => !isNaN(p) && p % 1 !== 0);
  }, [product]);

  // Get current variant pricing
  const getCurrentVariantPricing = () => {
    if (selectedVariant && product.variants) {
      const variant = product.variants.find(
        (v) => v.variant_id === selectedVariant || v.variantId === selectedVariant
      )
      if (variant?.price) {
        const resolvedCompareAtPrice = (variant.compareAtPrice == null || variant.compareAtPrice === '')
          ? product.compareAtPrice
          : variant.compareAtPrice;
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


  const goToPreviousImage = () => {
    const newIndex = currentImageIndex === 0 ? galleryImages.length - 1 : currentImageIndex - 1
    setCurrentImageIndex(newIndex)
    if (scrollerRef.current && mainItemWidth > 0) {
      scrollerRef.current.scrollTo({ left: newIndex * mainItemWidth, behavior: 'smooth' })
    }
    if (thumbRef.current && thumbItemWidth > 0) {
      thumbRef.current.scrollTo({ left: newIndex * thumbItemWidth, behavior: 'smooth' })
    }
  }

  const goToNextImage = () => {
    const newIndex = currentImageIndex === galleryImages.length - 1 ? 0 : currentImageIndex + 1
    setCurrentImageIndex(newIndex)
    if (scrollerRef.current && mainItemWidth > 0) {
      scrollerRef.current.scrollTo({ left: newIndex * mainItemWidth, behavior: 'smooth' })
    }
    if (thumbRef.current && thumbItemWidth > 0) {
      thumbRef.current.scrollTo({ left: newIndex * thumbItemWidth, behavior: 'smooth' })
    }
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
    if (scrollerRef.current && mainItemWidth > 0) {
      scrollerRef.current.scrollTo({ left: index * mainItemWidth, behavior: 'smooth' })
    }
    if (thumbRef.current && thumbItemWidth > 0) {
      thumbRef.current.scrollTo({ left: index * thumbItemWidth, behavior: 'smooth' })
    }
  }
  
  const goToFullScreenPrevious = () => {
    setFullScreenIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
  }
  
  const goToFullScreenNext = () => {
    setFullScreenIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))
  }
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (galleryImages.length <= 1) return
    touchRef.current.startX = e.touches[0].clientX
    touchRef.current.deltaX = 0
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (galleryImages.length <= 1 || !touchRef.current.startX) return
    const currentX = e.touches[0].clientX
    touchRef.current.deltaX = currentX - touchRef.current.startX
    if (Math.abs(touchRef.current.deltaX) > 10 && scrollerRef.current) {
      e.preventDefault()
      scrollerRef.current.scrollLeft -= touchRef.current.deltaX
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (galleryImages.length <= 1 || !touchRef.current.startX) return
    const endX = e.changedTouches[0].clientX
    const diff = touchRef.current.startX - endX
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNextImage()
      } else {
        goToPreviousImage()
      }
    } else if (scrollerRef.current && mainItemWidth > 0) {
      const scrollLeft = scrollerRef.current.scrollLeft
      const index = Math.round(scrollLeft / mainItemWidth)
      const boundedIndex = Math.min(Math.max(index, 0), galleryImages.length - 1)
      scrollerRef.current.scrollTo({ left: boundedIndex * mainItemWidth, behavior: 'smooth' })
      setCurrentImageIndex(boundedIndex)
    }
    touchRef.current.startX = 0
    touchRef.current.deltaX = 0
  }
  
  const handleFullScreenTouchStart = (e: React.TouchEvent) => {
    if (galleryImages.length <= 1) return
    touchRef.current.startX = e.touches[0].clientX
    touchRef.current.deltaX = 0
  }

  const handleFullScreenTouchMove = (e: React.TouchEvent) => {
    if (galleryImages.length <= 1 || !touchRef.current.startX) return
    const currentX = e.touches[0].clientX
    touchRef.current.deltaX = currentX - touchRef.current.startX
    if (Math.abs(touchRef.current.deltaX) > 50) {
      e.preventDefault()
    }
  }

  const handleFullScreenTouchEnd = (e: React.TouchEvent) => {
    if (galleryImages.length <= 1 || !touchRef.current.startX) return
    const endX = e.changedTouches[0].clientX
    const diff = touchRef.current.startX - endX
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToFullScreenNext()
      } else {
        goToFullScreenPrevious()
      }
    }
    touchRef.current.startX = 0
    touchRef.current.deltaX = 0
  }

  useEffect(() => {
    if (isFullScreenGallery) {
      modalRef.current?.focus()
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsFullScreenGallery(false)
        } else if (e.key === 'ArrowLeft') {
          goToFullScreenPrevious()
        } else if (e.key === 'ArrowRight') {
          goToFullScreenNext()
        }
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullScreenGallery, fullScreenIndex])

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

  // Update prices when selected variant changes
  useEffect(() => {
    const { price, compareAtPrice } = getCurrentVariantPricing()
    // Note: We don't need to set state here since we're calculating the values on render
  }, [selectedVariant, product])


  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    try {
      let effectiveVariantId = selectedVariant;
      if (!effectiveVariantId && colors.length === 1 && selectedSize && product.variants) {
        const matchingVariant = product.variants.find((v) => {
          const title = (v.variant_title || v.name || '').trim();
          const parts = title.split('/').map((p) => p.trim());
          return parts.length >= 2 && parts[0] === selectedColor && parts[1] === selectedSize;
        });
        if (matchingVariant) {
          effectiveVariantId = matchingVariant.variant_id || matchingVariant.variantId || '';
        }
      }
      if (!effectiveVariantId && product.variants && product.variants.length > 0) {
        effectiveVariantId = product.variants[0].variant_id || product.variants[0].variantId || '';
      }
      const cart = await ShopifyCartService.addToCart(effectiveVariantId, quantity)

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
          {/* Main image with navigation arrows */}
          {/* Main gallery - scrollable on mobile, single view with arrows on desktop */}
          <div
            ref={mainGalleryRef}
            className="relative w-full rounded-lg bg-gray-50 group cursor-pointer h-80 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Scroller wrapper */}
            <div
              ref={scrollerRef}
              className="flex overflow-x-auto md:overflow-hidden snap-x snap-mandatory scrollbar-hide h-full"
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <div className="flex h-fit w-full md:w-max">
                {galleryImages.map((image, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-full md:w-[400px] h-80 snap-center flex items-center justify-center relative rounded-lg border border-gray-200 overflow-hidden"
                    onClick={(e) => {
                      if (isMobile && !(e.target as Element)?.closest('button')) {
                        setIsFullScreenGallery(true)
                        setFullScreenIndex(index)
                      }
                    }}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${productName} ${index + 1}`}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 rounded-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                    />
                    {compareAtPrice && index === 0 && <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs z-10">Sale</Badge>}
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed overlays for counter and gallery fullscreen button - does not slide with swipe */}
            {galleryImages.length > 1 && (
              <div className="absolute inset-0 z-20 flex justify-between items-end pb-2 px-2 pointer-events-none">
                {/* Image counter - fixed position, updates with index */}
                <Badge
                  variant="secondary"
                  className="bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full pointer-events-auto"
                >
                  {currentImageIndex + 1} / {galleryImages.length}
                </Badge>

                {/* Gallery fullscreen button - overlaid on top */}
                {!isFullScreenGallery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsFullScreenGallery(true)
                      setFullScreenIndex(currentImageIndex)
                    }}
                    className="h-8 w-8 p-0 bg-black/80 backdrop-blur-sm hover:bg-black/90 text-white opacity-50 hover:opacity-100 transition-opacity duration-200 z-30 pointer-events-auto"
                    aria-label="Enter fullscreen gallery"
                    title="Open fullscreen gallery"
                  >
                    <MaximizeIcon />
                  </Button>
                )}
              </div>
            )}

            {/* Navigation arrows - only show if more than one image */}
            {galleryImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousImage}
                  className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextImage}
                  className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                >
                  <ChevronRightIcon />
                </Button>
              </>
            )}

            {/* Fullscreen indicator - only in non-fullscreen mode */}
            {!isFullscreen && onToggleFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFullscreen()
                }}
                className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                aria-label="Expand image gallery to fullscreen"
                role="button"
              >
                <MaximizeIcon />
              </Button>
            )}
          </div>

          {/* Thumbnail navigation - only show if more than one image */}
          {galleryImages.length > 1 && (
            <div
              ref={thumbRef}
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide h-fit"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              onScroll={(e) => {
                e.currentTarget.style.setProperty('webkit-overflow-scrolling', 'touch')
              }}
            >
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
              className="flex-1 text-white shadow-sm hover:shadow-md transition-all duration-200"
              disabled={isAddingToCart}
              style={{ backgroundColor: accentColor }}
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

      {/* Full-screen mobile gallery modal */}
      {isFullScreenGallery && galleryImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} image gallery`}
          onClick={() => setIsFullScreenGallery(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsFullScreenGallery(false)
            }
          }}
          tabIndex={-1}
        >
          <div
            ref={modalRef}
            className="relative w-full h-fit max-h-[90vh] max-w-6xl flex items-center justify-center p-4"
            onClick={(e) => {
              const target = e.target as Element
              if (target === e.currentTarget || (!(target as Element)?.closest('button') && target.tagName !== 'IMG')) {
                setIsFullScreenGallery(false)
              }
            }}
            onTouchStart={handleFullScreenTouchStart}
            onTouchMove={handleFullScreenTouchMove}
            onTouchEnd={handleFullScreenTouchEnd}
          >
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation()
                setIsFullScreenGallery(false)
              }}
            >
              <XIcon />
            </Button>

            <div className="flex items-center justify-center h-fit max-h-[90vh] rounded-lg overflow-hidden">
              <Image
                src={galleryImages[fullScreenIndex] || "/placeholder.svg"}
                alt={`${productName} full screen ${fullScreenIndex + 1}`}
                width={1200}
                height={1200}
                className="block max-w-full max-h-[85vh] object-cover mx-auto rounded-lg"
                sizes="90vw"
              />
            </div>

            {galleryImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToFullScreenPrevious()
                  }}
                  className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 p-0 bg-white/20 hover:bg-white/30 text-white z-10"
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToFullScreenNext()
                  }}
                  className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 p-0 bg-white/20 hover:bg-white/30 text-white z-10"
                >
                  <ChevronRightIcon />
                </Button>
              </>
            )}

            {galleryImages.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full z-20 sm:bottom-10 sm:px-4 sm:py-1.5 sm:text-base">
                {fullScreenIndex + 1} / {galleryImages.length}
              </div>
            )}
          </div>
        </div>
      )}

    </Card>
  )
}
