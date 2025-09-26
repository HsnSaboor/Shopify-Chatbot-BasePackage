"use client"

import type { Message } from "@/components/chatbot-widget/types"
import type { ChatResponse } from "@/components/chatbot-widget/types"
import type { ChatRequest } from "@/lib/chat-validation"
import type { ShopifyCookies } from "@/hooks/useShopifyCookies"
import { useToast } from "@/hooks/use-toast"

interface SendMessagePayload {
  type: "text" | "voice"
  message?: string
  audioData?: string
  timestamp?: number
}

interface SendMessageDeps {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isPreview: boolean
  mockMessages?: any[]
  onMockInteraction?: (action: string, data: any) => void
  toast: ReturnType<typeof useToast>["toast"]
  cookies?: ShopifyCookies
}

export async function sendMessage(
  payload: SendMessagePayload,
  deps: SendMessageDeps
): Promise<void> {
  const { messages, setMessages, isPreview, mockMessages = [], onMockInteraction, toast, cookies } = deps

  if (isPreview) {
    if (payload.type === "text" && payload.message) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: payload.message,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Simulate AI response with mock data
      setTimeout(() => {
        const mockResponses = [
          {
            content: "Great choice! I found some perfect products for you:",
            products: [
              {
                id: "mock-product-1",
                title: "Summer Breeze T-Shirt",
                price: 2499,
                compareAtPrice: 3299,
                image: "/placeholder.svg?height=300&width=300&text=Summer+Tee",
                url: "/products/summer-breeze-tshirt",
                variants: [
                  { id: "color-blue", name: "Ocean Blue", type: "color", value: "#0ea5e9", variantId: "summer-blue" },
                  { id: "color-green", name: "Forest Green", type: "color", value: "#22c55e", variantId: "summer-green" },
                  { id: "color-coral", name: "Coral Pink", type: "color", value: "#f97316", variantId: "summer-coral" },
                  { id: "color-white", name: "Pure White", type: "color", value: "#FFFFFF", variantId: "summer-white" },
                  { id: "size-s", name: "Small", type: "size", value: "S", variantId: "summer-s" },
                  { id: "size-m", name: "Medium", type: "size", value: "M", variantId: "summer-m" },
                  { id: "size-l", name: "Large", type: "size", value: "L", variantId: "summer-l" },
                  { id: "size-xl", name: "X-Large", type: "size", value: "XL", variantId: "summer-xl" },
                ],
              },
            ],
          },
          {
            content: "I'd be happy to help you with that! Let me show you our bestsellers:",
            products: [
              {
                id: "mock-product-2",
                title: "Classic Denim Jacket",
                price: 7999,
                compareAtPrice: 9999,
                image: "/placeholder.svg?height=300&width=300&text=Denim+Jacket",
                url: "/products/classic-denim-jacket",
                variants: [
                  { id: "color-indigo", name: "Classic Indigo", type: "color", value: "#4338ca", variantId: "denim-indigo" },
                  { id: "color-black", name: "Midnight Black", type: "color", value: "#000000", variantId: "denim-black" },
                  { id: "color-light", name: "Light Wash", type: "color", value: "#93c5fd", variantId: "denim-light" },
                  { id: "size-s", name: "Small", type: "size", value: "S", variantId: "denim-s" },
                  { id: "size-m", name: "Medium", type: "size", value: "M", variantId: "denim-m" },
                  { id: "size-l", name: "Large", type: "size", value: "L", variantId: "denim-l" },
                  { id: "size-xl", name: "X-Large", type: "size", value: "XL", variantId: "denim-xl" },
                ],
              },
            ],
          },
          {
            content: "Perfect! Here are some great options based on your preferences. These are currently trending and have excellent reviews from our customers.",
            products: [
              {
                id: "mock-product-3",
                title: "Cozy Knit Sweater",
                price: 5499,
                image: "/placeholder.svg?height=300&width=300&text=Knit+Sweater",
                url: "/products/cozy-knit-sweater",
                variants: [
                  { id: "color-cream", name: "Cream", type: "color", value: "#fef3c7", variantId: "knit-cream" },
                  { id: "color-burgundy", name: "Burgundy", type: "color", value: "#991b1b", variantId: "knit-burgundy" },
                  { id: "color-forest", name: "Forest Green", type: "color", value: "#166534", variantId: "knit-forest" },
                  { id: "color-navy", name: "Navy", type: "color", value: "#1e3a8a", variantId: "knit-navy" },
                  { id: "size-xs", name: "X-Small", type: "size", value: "XS", variantId: "knit-xs" },
                  { id: "size-s", name: "Small", type: "size", value: "S", variantId: "knit-s" },
                  { id: "size-m", name: "Medium", type: "size", value: "M", variantId: "knit-m" },
                  { id: "size-l", name: "Large", type: "size", value: "L", variantId: "knit-l" },
                ],
              },
            ],
          },
        ]

        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]

        const botMessage: Message = {
          id: Date.now().toString(),
          type: "bot",
          content: randomResponse.content,
          timestamp: new Date(),
          products: randomResponse.products,
        }

        setMessages((prev) => [...prev, botMessage])
        onMockInteraction?.("message_sent", { message: payload.message, response: randomResponse })
      }, 1000)
    }
    return
  }

  setMessages((prev) => {
    // Add user message to chat (for text messages)
    if (payload.type === "text" && payload.message) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: payload.message,
        timestamp: new Date(),
      }
      return [...prev, userMessage]
    }
    return prev
  })

  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000 * attempt) // Increase timeout per attempt

      let requestBody: ChatRequest = {
        ...payload,
        shopify_y: cookies?.shopify_y || "",
        cart_currency: cookies?.cart_currency || "USD",
        localization: cookies?.localization || "en-US",
      }

      // Add user data from localStorage if available
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('chatbotOnboarded')
        if (stored) {
          try {
            const data = JSON.parse(stored)
            if (data.user) {
              requestBody.user = data.user
            }
          } catch (error) {
            console.error('Error parsing onboarded data:', error)
          }
        }
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": crypto.randomUUID(),
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data: ChatResponse = await response.json()

      const botMessage: Message = {
        id: Date.now().toString(),
        type: "bot",
        content: data.message,
        timestamp: new Date(),
        cards: data.cards,
        order: data.order,
        event_type: data.event_type,
      }

      setMessages((prev) => [...prev, botMessage])
      return; // Success, exit retry loop
    } catch (error) {
      console.warn(`Chat fetch attempt ${attempt} failed:`, error)
      lastError = error;

      if (attempt === maxRetries) {
        // Final attempt failed
        console.error("Chat error after retries:", error)

        let errorMessage = "I'm having trouble connecting right now. Please try again in a moment."

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            errorMessage = "The request timed out. Please try again."
          } else if (error.message.includes("401")) {
            errorMessage = "Authentication error. Please refresh the page."
          } else if (error.message.includes("422")) {
            errorMessage = "Invalid message format. Please try again."
          }
        }

        const errorBotMessage: Message = {
          id: Date.now().toString(),
          type: "bot",
          content: errorMessage,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorBotMessage])

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
}