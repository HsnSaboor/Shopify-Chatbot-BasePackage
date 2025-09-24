"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Variant {
  size?: string
  color?: string
  variantId?: string
  variant_id?: string
  variant_title?: string
  options?: string[]
  id?: string
  name?: string
  type?: string
  value?: string
  price?: string
  compareAtPrice?: string
}

interface Product {
  variants?: Variant[]
}

interface VariantSelectorProps {
  product: Product
  selectedColor: string
  selectedSize: string
  onColorSelect: (id: string, name: string) => void
  onSizeSelect: (id: string, name: string) => void
  accentColor?: string
}

interface ColorOption {
  name: string
  value: string
  id: string
}

interface SizeOption {
  name: string
  value: string
  id: string
}

const CheckIconComponent = () => (
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

export function VariantSelector({ product, selectedColor, selectedSize, onColorSelect, onSizeSelect, accentColor = "#4f46e5" }: VariantSelectorProps) {
  const [colors, setColors] = useState<ColorOption[]>([])
  const [sizes, setSizes] = useState<SizeOption[]>([])

  const processVariants = () => {
    if (!product.variants) return { colors: [], sizes: [] }

    console.log('[VariantSelector] Processing variants:', product.variants)

    const newColors: ColorOption[] = []
    const newSizes: SizeOption[] = []

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
        console.log('[VariantSelector] Found color:', variantColor, 'for variant:', variantId)
        const existing = newColors.find((c) => c.name.toLowerCase() === variantColor.toLowerCase().trim())
        if (!existing) {
          newColors.push({
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
        console.log('[VariantSelector] Found size:', variantSize, 'for variant:', variantId)
        const cleanSize = variantSize.trim()
        // Check if it's a valid size
        if (/^(XXS|XS|S|M|L|XL|2XL|3XL|XXL|XXXL|\d+XL?|\d+)$/i.test(cleanSize)) {
          const existing = newSizes.find((s) => s.name.toLowerCase() === cleanSize.toLowerCase())
          if (!existing) {
            newSizes.push({
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
              console.log('[VariantSelector] Found size from options:', cleanOption, 'for variant:', variantId)
              const existing = newSizes.find((s) => s.name.toLowerCase() === cleanOption.toLowerCase())
              if (!existing) {
                newSizes.push({
                  name: cleanOption,
                  value: cleanOption,
                  id: variantId,
                })
              }
            } else {
              // Treat as color
              console.log('[VariantSelector] Found color from options:', cleanOption, 'for variant:', variantId)
              const existing = newColors.find((c) => c.name.toLowerCase() === cleanOption.toLowerCase())
              if (!existing) {
                newColors.push({
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
        const existing = newColors.find((c) => c.value === variant.value)
        if (!existing) {
          newColors.push({
            name: variant.name,
            value: variant.value,
            id: variant.id || variant.variantId || variant.variant_id || "",
          })
        }
      } else if (variant.type === "size" && variant.value && variant.name) {
        const existing = newSizes.find((s) => s.value === variant.value)
        if (!existing) {
          newSizes.push({
            name: variant.name,
            value: variant.value,
            id: variant.id || variant.variantId || variant.variant_id || "",
          })
        }
      }
      // Handle old format with color/size properties
      else if (variant.color) {
        const existing = newColors.find((c) => c.name === variant.color)
        if (!existing) {
          newColors.push({
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
        const existing = newSizes.find((s) => s.name === variant.size)
        if (!existing) {
          newSizes.push({
            name: variant.size,
            value: variant.size,
            id: variant.id || variant.variantId || variant.variant_id || "",
          })
        }
      }
    })

    // Sort sizes according to standard order
    newSizes.sort((a, b) => {
      const orderA = sizeOrder[a.name.toUpperCase()] || 999
      const orderB = sizeOrder[b.name.toUpperCase()] || 999
      return orderA - orderB
    })

    console.log('[VariantSelector] Final processed colors:', newColors)
    console.log('[VariantSelector] Final processed sizes:', newSizes)

    setColors(newColors)
    setSizes(newSizes)

    return { colors: newColors, sizes: newSizes }
  }

  useEffect(() => {
    processVariants()
  }, [product.variants])

  // Auto-select color if there's only one option
  useEffect(() => {
    if (colors.length === 1 && !selectedColor) {
      onColorSelect(colors[0].id, colors[0].name)
    }
  }, [colors, selectedColor])

  const handleColorSelect = (colorId: string, colorName: string) => {
    onColorSelect(colorId, colorName)
  }

  const handleSizeSelect = (sizeId: string, sizeName: string) => {
    onSizeSelect(sizeId, sizeName)
  }

  return (
    <>
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
                    <CheckIconComponent />
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
    </>
  )
}