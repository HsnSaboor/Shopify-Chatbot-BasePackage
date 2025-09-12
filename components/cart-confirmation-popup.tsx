"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type CartResponse, ShopifyCartService } from "@/lib/shopify-cart"

// Icon components remain the same
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

// Function to create popup HTML for parent window
export function createCartPopupHTML(cart: any) {
  // Format cart items
  const cartItemsHTML = cart.items && Array.isArray(cart.items) && cart.items.length > 0 
    ? cart.items.slice(0, 3).map((item: any) => `
      <div class="flex justify-between text-sm">
        <span class="truncate flex-1 mr-2">${item.name}</span>
        <span class="font-medium">${item.price}</span>
      </div>
    `).join('') + (cart.items.length > 3 ? `<p class="text-xs text-gray-500">+${cart.items.length - 3} more items</p>` : '')
    : '<p class="text-xs text-gray-500">No items in cart</p>';

  return `
    <div class="w-full max-w-md mx-4">
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="text-center pb-4 pt-6 px-6">
          <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-green-700">Added to Cart!</h3>
          <p class="text-sm text-gray-600">Auto-closing in 5 seconds</p>
        </div>

        <div class="px-6 pb-6 space-y-4">
          <!-- Cart Summary -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-medium flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L23 6H6" />
                </svg>
                Cart Summary
              </h4>
              <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                ${cart.item_count} ${cart.item_count === 1 ? "item" : "items"}
              </span>
            </div>

            <div class="space-y-2 max-h-32 overflow-y-auto">
              ${cartItemsHTML}
            </div>

            <div class="border-t pt-2 mt-3">
              <div class="flex justify-between font-semibold">
                <span>Total:</span>
                <span>${ShopifyCartService.formatPrice(cart.total_price, cart.currency)}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button id="view-cart-btn" class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              View Cart
            </button>
            <button id="checkout-btn" class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
              Checkout
            </button>
          </div>

          <button id="close-popup-btn" class="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m18 6-12 12" />
              <path d="m6 6 12 12" />
            </svg>
            <span class="ml-2">Close</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

interface CartConfirmationPopupProps {
  isOpen: boolean
  onClose: () => void
  cart: CartResponse | null
}

export function CartConfirmationPopup({ isOpen, onClose, cart }: CartConfirmationPopupProps) {
  const [timeLeft, setTimeLeft] = useState(5)

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(5)
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
              {cart.items && Array.isArray(cart.items) && cart.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="truncate flex-1 mr-2">{item.name}</span>
                  <span className="font-medium">{item.price}</span>
                </div>
              ))}
              {cart.items && Array.isArray(cart.items) && cart.items.length > 3 && <p className="text-xs text-gray-500">+{cart.items.length - 3} more items</p>}
              {(!cart.items || !Array.isArray(cart.items) || cart.items.length === 0) && (
                <p className="text-xs text-gray-500">No items in cart</p>
              )}
            </div>

            <div class="border-t pt-2 mt-3">
              <div class="flex justify-between font-semibold">
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