"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ProductCard } from "@/components/product-card"
import { OrderCard } from "@/components/order-card"

import { useToast } from "@/hooks/use-toast"
import type { CartResponse } from "@/lib/shopify-cart"
import { ChatStateService } from "@/lib/chat-state"

// Simple icon components to avoid import issues
const MessageCircleIcon = () => (
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
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

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

const SendIcon = () => (
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
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
)

const MicIcon = () => (
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
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <path d="M12 19v3" />
  </svg>
)

const MicOffIcon = () => (
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
    <line x1="2" x2="22" y1="2" y2="22" />
    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
    <path d="M5 10v2a7 7 0 0 0 12 5" />
    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
    <path d="M12 19v3" />
  </svg>
)

const LoaderIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="animate-spin"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)

interface Message {
  id: string
  role?: "user" | "assistant"
  type?: "user" | "bot"
  content: string
  timestamp: Date
  cards?: ProductCardData[]
  products?: any[]
  order?: Order
  event_type?: string
}

interface Order {
  id: string;
  order_number: number;
  created_at: string;
  fulfillment_status: string | null;
  items: Array<{
    product_id: string;
    title: string;
    price: string;
    variant_id: string;
    quantity: number;
  }>;
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  shipping_address: {
    name: string;
    address1: string;
    address2: string;
    city: string;
    province: string;
    zip: string;
    country: string;
  };
  payment_method: string;
}

interface ProductCardData {
  id: string
  variantId: string
  name: string
  image: string
  price: string
  url: string
  variants: Array<{
    size: string
    color: string
    variantId: string
  }>
}

interface ChatResponse {
  message: string
  event_type: string
  product_id?: string
  product_name?: string
  order_id?: string
  cards?: ProductCardData[]
  order?: Order
}

interface ChatbotWidgetProps {
  isPreview?: boolean
  mockMessages?: Message[]
  onMockInteraction?: (action: string, data: any) => void
  hideToggle?: boolean
}

export function ChatbotWidget({
  isPreview = false,
  mockMessages = [],
  onMockInteraction,
  hideToggle = false,
}: ChatbotWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCartPopup, setShowCartPopup] = useState(false)
  const [cartData, setCartData] = useState<CartResponse | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isDirectMode, setIsDirectMode] = useState(false)

  const [messages, setMessages] = useState<Message[]>(
    isPreview && mockMessages.length > 0
      ? mockMessages.map((msg) => ({
          ...msg,
          type: msg.role === "user" ? "user" : "bot",
        }))
      : [
          {
            id: "1",
            type: "bot",
            content:
              "Hi! I'm your AI shopping assistant. I can help you find products, check order status, and answer any questions you have. How can I help you today?",
            timestamp: new Date(),
          },
        ],
  )

  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (isPreview) return

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data

      switch (type) {
        case "REOPEN_CHATBOT":
        case "OPEN_CHATBOT":
        case "OPEN_CHAT":
          setIsOpen(true)
          break

        case "CLOSE_CHATBOT":
        case "CLOSE_CHAT":
          setIsOpen(false)
          break
          
        case "TOGGLE_CHAT":
          setIsOpen(prev => !prev)
          break

        case "CLEAR_HISTORY":
          clearChatHistory()
          break
          
        case "EXTERNAL_CONTROL_ACTIVE":
          // External script is managing the iframe - this is normal
          console.log('External control active for chatbot iframe')
          break
      }
    }

    window.addEventListener("message", handleMessage)

    // Notify parent that chatbot is ready
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "CHATBOT_READY",
          timestamp: Date.now(),
        },
        "*",
      )
    }

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [isPreview])

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (isPreview) return

    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "CHATBOT_STATE_CHANGED",
          data: { isOpen, messageCount: messages.length },
        },
        "*",
      )
    }
  }, [isOpen, messages.length, isPreview])

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (isPreview) return

    const savedState = ChatStateService.loadState()
    if (savedState && savedState.messages && Array.isArray(savedState.messages)) {
      // Convert timestamp strings back to Date objects
      const messagesWithDates = savedState.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }))

      setMessages(messagesWithDates)

      // Auto-reopen if it was previously open
      if (savedState.isOpen) {
        setTimeout(() => setIsOpen(true), 500) // Small delay for smooth animation
      }
    }
  }, [isPreview])

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (isPreview) return

    const state = {
      messages,
      isOpen,
      lastActivity: Date.now(),
    }
    ChatStateService.saveState(state)
  }, [messages, isOpen, isPreview])

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (isPreview) return

    const handleBeforeUnload = () => {
      const state = {
        messages,
        isOpen,
        lastActivity: Date.now(),
      }
      ChatStateService.saveState(state)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const state = {
          messages,
          isOpen,
          lastActivity: Date.now(),
        }
        ChatStateService.saveState(state)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [messages, isOpen, isPreview])

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    
    // Handle orientation changes which might affect viewport height
    window.addEventListener("orientationchange", () => {
      setTimeout(checkMobile, 100)
    })

    return () => {
      window.removeEventListener("resize", checkMobile)
      window.removeEventListener("orientationchange", checkMobile)
    }
  }, [])

  // Effect to handle ultra-tall screens
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    // Prevent body scrolling when chat is open on mobile
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    const handleResize = () => {
      if (isMobile) {
        // Get the actual viewport height
        const viewportHeight = window.innerHeight;
        
        // Set CSS custom properties
        document.documentElement.style.setProperty('--chat-window-height', `${viewportHeight}px`);
        document.documentElement.style.setProperty('--chat-window-max-height', `${viewportHeight}px`);
        
        // For ultra-tall screens, adjust the messages container height
        const headerHeight = 70; // Approximate header height
        const inputHeight = 80;  // Approximate input area height
        const adjustedHeight = viewportHeight - headerHeight - inputHeight;
        document.documentElement.style.setProperty('--messages-container-max-height', `${adjustedHeight}px`);
      }
    };

    // Run on mount and when mobile state changes
    handleResize();
    
    // Also listen for resize events
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      // Clean up CSS custom properties
      document.documentElement.style.removeProperty('--chat-window-height');
      document.documentElement.style.removeProperty('--chat-window-max-height');
      document.documentElement.style.removeProperty('--messages-container-max-height');
      // Reset body overflow
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get("mode")
    const embedded = urlParams.get("embedded")
    
    setIsDirectMode(mode === "direct")

    // Hide toggle if embedded via external script or hideToggle prop
    if (hideToggle || embedded === "true") {
      setIsOpen(true)
    }
  }, [hideToggle])

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (isPreview) return

    if (window.parent !== window) {
      const height = isOpen || hideToggle ? "100dvh" : "70px";
      const width = isOpen || hideToggle ? (isMobile ? "100vw" : "500px") : "70px";
      
      window.parent.postMessage(
        {
          type: "CHATBOT_RESIZE",
          data: {
            isOpen: isOpen || hideToggle,
            width,
            height,
          },
        },
        "*",
      )
    }
  }, [isOpen, hideToggle, isPreview, isMobile])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (messagePayload: {
    type: "text" | "voice"
    message?: string
    audioData?: string
    timestamp?: number
  }) => {
    if (isPreview) {
      if (messagePayload.type === "text" && messagePayload.message) {
        const userMessage: Message = {
          id: Date.now().toString(),
          type: "user",
          content: messagePayload.message,
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
                    {
                      id: "color-green",
                      name: "Forest Green",
                      type: "color",
                      value: "#22c55e",
                      variantId: "summer-green",
                    },
                    {
                      id: "color-coral",
                      name: "Coral Pink",
                      type: "color",
                      value: "#f97316",
                      variantId: "summer-coral",
                    },
                    {
                      id: "color-white",
                      name: "Pure White",
                      type: "color",
                      value: "#FFFFFF",
                      variantId: "summer-white",
                    },
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
                    {
                      id: "color-indigo",
                      name: "Classic Indigo",
                      type: "color",
                      value: "#4338ca",
                      variantId: "denim-indigo",
                    },
                    {
                      id: "color-black",
                      name: "Midnight Black",
                      type: "color",
                      value: "#000000",
                      variantId: "denim-black",
                    },
                    {
                      id: "color-light",
                      name: "Light Wash",
                      type: "color",
                      value: "#93c5fd",
                      variantId: "denim-light",
                    },
                    { id: "size-s", name: "Small", type: "size", value: "S", variantId: "denim-s" },
                    { id: "size-m", name: "Medium", type: "size", value: "M", variantId: "denim-m" },
                    { id: "size-l", name: "Large", type: "size", value: "L", variantId: "denim-l" },
                    { id: "size-xl", name: "X-Large", type: "size", value: "XL", variantId: "denim-xl" },
                  ],
                },
              ],
            },
            {
              content:
                "Perfect! Here are some great options based on your preferences. These are currently trending and have excellent reviews from our customers.",
              products: [
                {
                  id: "mock-product-3",
                  title: "Cozy Knit Sweater",
                  price: 5499,
                  image: "/placeholder.svg?height=300&width=300&text=Knit+Sweater",
                  url: "/products/cozy-knit-sweater",
                  variants: [
                    { id: "color-cream", name: "Cream", type: "color", value: "#fef3c7", variantId: "knit-cream" },
                    {
                      id: "color-burgundy",
                      name: "Burgundy",
                      type: "color",
                      value: "#991b1b",
                      variantId: "knit-burgundy",
                    },
                    {
                      id: "color-forest",
                      name: "Forest Green",
                      type: "color",
                      value: "#166534",
                      variantId: "knit-forest",
                    },
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
          onMockInteraction?.("message_sent", { message: messagePayload.message, response: randomResponse })
        }, 1000)
      }
      return
    }

    setIsLoading(true)

    // Add user message to chat (for text messages)
    if (messagePayload.type === "text" && messagePayload.message) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: messagePayload.message,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": crypto.randomUUID(),
        },
        body: JSON.stringify({
          ...messagePayload,
          cart_currency: "USD",
          localization: "en-US",
        }),
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
    } catch (error) {
      console.error("Chat error:", error)

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
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendText = async () => {
    if (!inputValue.trim() || isLoading) return

    const message = inputValue.trim()
    setInputValue("")

    await sendMessage({
      type: "text",
      message,
    })
  }

  const startRecording = async () => {
    // Only run on client-side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      toast({
        title: "Recording error",
        description: "Recording is not available in this environment.",
        variant: "destructive",
      })
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data])
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
        const reader = new FileReader()

        reader.onloadend = async () => {
          const base64Audio = reader.result as string
          await sendMessage({
            type: "voice",
            audioData: base64Audio,
            timestamp: Math.floor(Date.now() / 1000),
          })
        }

        reader.readAsDataURL(audioBlob)
        setAudioChunks([])

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      setMediaRecorder(recorder)
      recorder.start()
      setIsRecording(true)

      toast({
        title: "Recording started",
        description: "Speak your message now...",
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Recording error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)

      toast({
        title: "Recording stopped",
        description: "Processing your voice message...",
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const handleAddToCartSuccess = (cart: CartResponse) => {
    setCartData(cart)
    setShowCartPopup(true)

    if (isPreview) {
      onMockInteraction?.("add_to_cart", cart)
      return
    }

    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }

    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "ADD_TO_CART_SUCCESS",
          data: cart,
        },
        "*",
      )
    }
  }

  const clearChatHistory = () => {
    if (isPreview) {
      setMessages([
        {
          id: "1",
          type: "bot",
          content:
            "Hi! I'm your AI shopping assistant. I can help you find products, check order status, and answer any questions you have. How can I help you today?",
          timestamp: new Date(),
        },
      ])
      onMockInteraction?.("clear_history", {})
      return
    }

    ChatStateService.clearState()
    setMessages([
      {
        id: "1",
        type: "bot",
        content:
          "Hi! I'm your AI shopping assistant. I can help you find products, check order status, and answer any questions you have. How can I help you today?",
        timestamp: new Date(),
      },
    ])
    toast({
      title: "Chat cleared",
      description: "Your conversation history has been cleared.",
    })
  }

  return (
    <>
      {/* Chat Widget Button */}
      {!hideToggle && !isDirectMode && (
        <Button
          onClick={() => {
            setIsOpen(true)
            // Notify parent window about state change
            if (window.parent !== window) {
              window.parent.postMessage(
                {
                  type: "CHATBOT_OPENED_BY_USER",
                  data: { isOpen: true },
                },
                "*",
              )
            }
          }}
          className={cn(
            "h-16 w-16 rounded-full shadow-xl transition-all duration-300 hover:scale-110 z-[9998]",
            "bg-blue-600 hover:bg-blue-700 text-white border-2 border-white",
            isOpen && "scale-0 opacity-0",
            "fixed bottom-6 right-6",
          )}
          size="icon"
          style={{
            boxShadow: "0 8px 32px rgba(37, 99, 235, 0.3)",
          }}
        >
          <MessageCircleIcon />
        </Button>
      )}

      {/* Chat Window */}
      <div
        className={cn(
          "bg-white dark:bg-gray-900 rounded-xl shadow-2xl border transition-all duration-300 flex flex-col z-[9999]",
          "backdrop-blur-sm border-gray-200 dark:border-gray-700 chat-window-mobile",
          isOpen || hideToggle ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none",
          isMobile
            ? "inset-0 rounded-none h-[100dvh] w-screen max-h-[100dvh]" 
            : isDirectMode || hideToggle
              ? "absolute bottom-0 right-0 w-full h-full max-h-[100dvh]" 
              : "fixed bottom-6 right-6 max-w-[500px] w-[500px] h-[800px]",
        )}
        style={
          isMobile
            ? {
                transformOrigin: "center",
                boxShadow: "none",
                margin: 0,
                padding: 0,
                width: "100vw",
                height: "100dvh",
                maxHeight: "100dvh",
                boxSizing: "border-box",
                overflow: "hidden",
              }
            : hideToggle
              ? {
                  transformOrigin: "bottom right",
                  boxShadow: "none",
                  margin: 0,
                  padding: 0,
                  width: "100%",
                  height: "100%",
                  maxHeight: "100dvh",
                  minHeight: "800px",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }
              : {
                  transformOrigin: "bottom right",
                  boxShadow: "0 8px 32px rgba(37, 99, 235, 0.3)",
                  width: "500px",
                  height: "800px",
                  maxHeight: "calc(100dvh - 2rem)",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }
        }
      >
        {/* Header */}
        <div
          className={cn("flex items-center justify-between p-4 border-b", isMobile ? "rounded-none" : "rounded-t-xl")}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            paddingTop: isMobile ? "calc(1rem + env(safe-area-inset-top))" : "1rem",
          }}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 ring-2 ring-white/20">
              <AvatarFallback style={{ backgroundColor: "white", color: "#2563eb" }} className="text-xs font-bold">
                AI
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "white" }}>
                AI Shopping Assistant
                {isPreview && (
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white text-xs">
                    Preview
                  </Badge>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-xs" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  {isPreview ? "Demo Mode" : "Online & Ready to Help"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChatHistory}
                className="h-8 w-8 hover:bg-white/20 rounded-full transition-colors"
                style={{ color: "white" }}
                title="Clear chat history"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </Button>
            )}
            {!hideToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false)
                  // Notify parent window about state change
                  if (window.parent !== window) {
                    window.parent.postMessage(
                      {
                        type: "CHATBOT_CLOSED_BY_USER",
                        data: { isOpen: false },
                      },
                      "*",
                    )
                  }
                }}
                className="h-8 w-8 hover:bg-white/20 rounded-full transition-colors"
                style={{ color: "white" }}
                title={isMobile ? "Minimize" : "Close"}
              >
                {isMobile ? (
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
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                ) : (
                  <XIcon />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className={cn("flex-1 chat-messages-container", isMobile ? "p-4" : "p-6")} style={{ maxHeight: "calc(100dvh - 140px)" }}>
          <div className="space-y-4 pb-2" style={{ minHeight: "100%" }}>
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                <div className={cn("flex gap-3", message.type === "user" ? "justify-end" : "justify-start")}>
                  {message.type === "bot" && (
                    <Avatar className="h-8 w-8 mt-1 ring-2 ring-blue-100 flex-shrink-0">
                      <AvatarFallback
                        style={{ backgroundColor: "#2563eb", color: "white" }}
                        className="text-xs font-semibold"
                      >
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      isMobile ? "max-w-[85%]" : "max-w-[75%]",
                      "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      message.type === "user" ? "ml-auto shadow-sm" : "bg-gray-50 dark:bg-gray-800 shadow-sm",
                    )}
                    style={
                      message.type === "user"
                        ? {
                            backgroundColor: "#2563eb",
                            color: "white",
                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                          }
                        : {}
                    }
                  >
                    <p className="text-pretty">{message.content}</p>
                    {/* {message.event_type && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {message.event_type.replace("_", " ")}
                      </Badge>
                    )} */}
                  </div>
                </div>

                {/* Product Cards - support both cards and products */}
                {((message.cards && message.cards.length > 0) || (message.products && message.products.length > 0)) && (
                  <div className={cn(message.type === "bot" ? "ml-11" : "", "space-y-3")}>
                    {(message.cards || message.products || []).map((product: any) => (
                      <ProductCard key={product.id} product={product} onAddToCart={handleAddToCartSuccess} />
                    ))}
                  </div>
                )}

                {/* Order Card */}
                {message.order && (
                  <div className={cn(message.type === "bot" ? "ml-11" : "", "space-y-3")}>
                    <OrderCard order={message.order} />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 mt-1 ring-2 ring-blue-100">
                  <AvatarFallback
                    style={{ backgroundColor: "#2563eb", color: "white" }}
                    className="text-xs font-semibold"
                  >
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2 text-sm shadow-sm">
                  <div className="flex items-center gap-2">
                    <LoaderIcon />
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input */}
        <div
          className={cn(
            "border-t bg-gray-50/50 dark:bg-gray-800/50",
            isMobile ? "p-4 rounded-none" : "p-6 rounded-b-xl",
          )}
          style={{
            paddingBottom: isMobile ? "calc(1rem + env(safe-area-inset-bottom))" : "1rem",
          }}
        >
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isPreview ? "Try: 'Show me summer t-shirts'" : "Ask me anything about products..."}
              disabled={isLoading}
              className={cn(
                "flex-1 px-3 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20",
                isMobile ? "h-10 text-sm" : "h-12",
              )}
            />
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant="outline"
              size="icon"
              disabled={isLoading || isPreview}
              className={cn(
                "rounded-xl transition-all duration-200 border-gray-200",
                isMobile ? "h-10 w-10" : "h-12 w-12",
                isRecording
                  ? "bg-red-500 text-white hover:bg-red-600 border-red-500 animate-pulse"
                  : "hover:bg-gray-50",
                isPreview && "opacity-50 cursor-not-allowed",
              )}
            >
              {isRecording ? <MicOffIcon /> : <MicIcon />}
            </Button>
            <Button
              onClick={handleSendText}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className={cn(
                "rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-sm",
                isMobile ? "h-10 w-10" : "h-12 w-12",
              )}
            >
              <SendIcon />
            </Button>
          </div>
          <p className={cn("text-gray-500 dark:text-gray-400 mt-2 text-center", isMobile ? "text-xs" : "text-xs")}>
            {isPreview ? "Preview Mode • Try different messages" : "Press Enter to send • Click mic for voice"}
          </p>
        </div>
      </div>

      {/* Cart Confirmation Popup */}
      
    </>
  )
}
