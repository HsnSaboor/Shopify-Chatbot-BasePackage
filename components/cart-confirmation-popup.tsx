"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type CartResponse, ShopifyCartService } from "@/lib/shopify-cart"

const XIcon = () => (
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
    <path d="m18 6-12 12" />
    <path d="m6 6 12 12" />
  </svg>
)

const ShoppingCartIcon = () => (
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
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L23 6H6" />
  </svg>
)

const CheckIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

interface CartConfirmationPopupProps {
  isOpen: boolean
  onClose: () => void
  cart: CartResponse | null
}

export function CartConfirmationPopup({ isOpen, onClose, cart }: CartConfirmationPopupProps) {
  const [timeLeft, setTimeLeft] = useState(3)

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(3)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, onClose])

  if (!isOpen || !cart) return null

  const handleViewCart = () => {
    ShopifyCartService.navigateToCart()
    onClose()
  }

  const handleCheckout = () => {
    ShopifyCartService.navigateToCheckout()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <Card className="w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckIcon className="text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-green-700">Added to Cart!</CardTitle>
          <p className="text-sm text-gray-600">Auto-closing in {timeLeft} seconds</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Cart Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <ShoppingCartIcon />
                Cart Summary
              </h4>
              <Badge variant="secondary">
                {cart.item_count} {cart.item_count === 1 ? "item" : "items"}
              </Badge>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {cart.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="truncate flex-1 mr-2">{item.name}</span>
                  <span className="font-medium">{item.price}</span>
                </div>
              ))}
              {cart.items.length > 3 && <p className="text-xs text-gray-500">+{cart.items.length - 3} more items</p>}
            </div>

            <div className="border-t pt-2 mt-3">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{ShopifyCartService.formatPrice(cart.total_price, cart.currency)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleViewCart} variant="outline" className="flex-1 bg-transparent">
              View Cart
            </Button>
            <Button onClick={handleCheckout} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Checkout
            </Button>
          </div>

          <Button onClick={onClose} variant="ghost" size="sm" className="w-full">
            <XIcon />
            <span className="ml-2">Close</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
