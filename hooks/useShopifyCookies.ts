"use client"

import { useState, useEffect } from "react"

export interface ShopifyCookies {
  shopify_y: string
  cart_currency: string
  localization: string
}

export function useShopifyCookies() {
  const [cookies, setCookies] = useState<ShopifyCookies>({
    shopify_y: "",
    cart_currency: "USD",
    localization: "US"
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if in direct mode (not embedded)
    const isDirectMode = window.parent === window

    if (isDirectMode) {
      // Set mock cookies for direct access
      setCookies({
        shopify_y: "2024-09-24T01:02:20.744Z|mock-session|mock-uuid-1122",
        cart_currency: "USD",
        localization: "en-US"
      })
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SHOPIFY_COOKIES_UPDATE') {
        setCookies(event.data.data)
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return cookies
}