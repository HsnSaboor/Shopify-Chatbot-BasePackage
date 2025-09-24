"use client"

import type React from "react"

import { useState, useEffect } from "react"

declare global {
  interface Navigator {
    virtualKeyboard?: VirtualKeyboard;
  }

  interface VirtualKeyboard {
    overlaysContent: boolean;
    geometry: {
      height: number;
    };
    addEventListener(type: 'geometrychange', listener: () => void): void;
    removeEventListener(type: 'geometrychange', listener: () => void): void;
    ontouchstart?: boolean;
  }
}
import { useSearchParams } from "next/navigation"
import { useChatbotMessaging } from "@/hooks/useChatbotMessaging"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { ChatHeader } from "./chatbot-widget/ChatHeader"
import { ChatMessages } from "./chatbot-widget/ChatMessages"
import { ChatInput } from "./chatbot-widget/ChatInput"
import { OnboardingForm } from "./chatbot-widget/OnboardingForm"
import { sendMessage } from "@/lib/chat-service"

import { useToast } from "@/hooks/use-toast"
import type { CartResponse } from "@/lib/shopify-cart"
import { ChatStateService } from "@/lib/chat-state"

import {
  MessageCircleIcon} from "./chatbot-widget/icons"

import type {
  ChatbotWidgetProps
} from "./chatbot-widget/types"

import { useChatbotState } from "@/hooks/use-chatbot-state"
import { useShopifyCookies } from "@/hooks/useShopifyCookies"

// Add this interface to define the shape of the styling configuration
// At the top of the file, ensure the interface is defined:
export interface ChatbotStylingProps {
  closedWindow: { backgroundColor: string; borderColor: string; };
  chatHeader: { backgroundColor: string; name: string; tagline: string; };
  avatar: { imageUrl: string; borderStyle: string; showBorder: boolean; };
  userMessage: { backgroundColor: string; };
  sendButton: { backgroundColor: string; };
}

// THIS IS THE NEW PLACEHOLDER. IT IS A VALID OBJECT WITH A COMMENT MARKER.
const chatbotProps: ChatbotStylingProps = {
  closedWindow: { backgroundColor: '', borderColor: '' },
  chatHeader: { backgroundColor: '', name: '', tagline: '' },
  avatar: { imageUrl: '', borderStyle: '', showBorder: false },
  userMessage: { backgroundColor: '' },
  sendButton: { backgroundColor: '' }
}; /* __CHATBOT_PROPS_PLACEHOLDER__ */


export function ChatbotWidget({
  isPreview = false,
  mockMessages = [],
  onMockInteraction,
  hideToggle = false,
  embedded: propEmbedded = false,
}: ChatbotWidgetProps & { embedded?: boolean } = {}) {
  const searchParams = useSearchParams()
  const [showCartPopup, setShowCartPopup] = useState(false)
  const [cartData, setCartData] = useState<CartResponse | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isEmbedded, setIsEmbedded] = useState(propEmbedded)
  const [isDirectMode, setIsDirectMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  const { messages, setMessages, isOpen, setIsOpen } = useChatbotState({ isPreview, mockMessages, isEmbedded })

  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const { toast } = useToast()

  const cookies = useShopifyCookies()

  const clearChatHistory = () => {
    if (isPreview) {
      setMessages([
        {
          id: "1",
          type: "bot",
          content:
            "__AI_FIRST_REPLY_PLACEHOLDER__",
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
          "__AI_FIRST_REPLY_PLACEHOLDER__",
        timestamp: new Date(),
      },
    ])
    toast({
      title: "Chat cleared",
      description: "Your conversation history has been cleared.",
    })
  }

  useChatbotMessaging({
    isOpen,
    setIsOpen,
    messages,
    isPreview,
    hideToggle,
    isMobile,
    isFullscreen,
    clearChatHistory,
  })

  useEffect(() => {
    // Set initial isMobile
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768)
    }
  }, [])

  useEffect(() => {
    // Detect embedded mode, prioritize prop if provided
    if (propEmbedded) {
      setIsEmbedded(true)
      return
    }
    // Detect embedded mode
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const embedded = urlParams.get("embedded")
      setIsEmbedded(embedded === "true")
    }
  }, [propEmbedded])

  // Inject styles for embedded mode
  useEffect(() => {
    if (isEmbedded && typeof window !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          height: 100% !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      };
    }
  }, [isEmbedded]);

  // Force desktop layout in embedded mode to avoid mobile styles in iframe
  useEffect(() => {
    if (isEmbedded) {
      setIsMobile(false)
    }
  }, [isEmbedded])

  useEffect(() => {
    if (isOpen && !isPreview) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('chatbotOnboarded')
        setShowOnboarding(!stored)
      }
    }
  }, [isOpen, isPreview])

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get("mode")
    const embedded = urlParams.get("embedded")
    const respectClosed = urlParams.get("respectClosed") === "true"
    
    setIsDirectMode(mode === "direct")

    // Force open only if embedded/hideToggle, respecting manual close universally and onboarding
    if (hideToggle || embedded === "true") {
      const saved = ChatStateService.loadState();
      const onboarded = localStorage.getItem('chatbotOnboarded') === 'true';
      if (onboarded && (!respectClosed || !saved?.manuallyClosed)) {
        setIsOpen(true);
      }
    }
  }, [hideToggle])

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // VirtualKeyboard API integration
    if ('virtualKeyboard' in navigator && navigator.virtualKeyboard) {
      navigator.virtualKeyboard.overlaysContent = true;

      const handleGeometryChange = () => {
        const { height } = navigator.virtualKeyboard!.geometry;
        setKeyboardHeight(height);
        setIsKeyboardOpen(height > 0);
        setViewportHeight(window.visualViewport?.height || window.innerHeight);
      };

      // Initial call
      if (navigator.virtualKeyboard.ontouchstart) {
        handleGeometryChange();
      }

      navigator.virtualKeyboard.addEventListener('geometrychange', handleGeometryChange);

      return () => {
        navigator.virtualKeyboard!.removeEventListener('geometrychange', handleGeometryChange);
      };
    }

    // Fallback: basic resize listener for non-supporting devices
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      if (window.visualViewport) {
        const vvHeight = window.visualViewport.height;
        const kbHeight = window.innerHeight - vvHeight;
        if (kbHeight > 100) {
          setKeyboardHeight(kbHeight);
          setIsKeyboardOpen(true);
        } else {
          setKeyboardHeight(0);
          setIsKeyboardOpen(false);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = async (messagePayload: {
    type: "text"
    message?: string
  }) => {
    setIsLoading(true)
    await sendMessage(messagePayload, {
      messages,
      setMessages,
      isPreview,
      mockMessages: mockMessages,
      onMockInteraction,
      cookies,
      toast,
    })
    setIsLoading(false)
  }

  const handleSendText = async () => {
    if (!inputValue.trim() || isLoading) return

    const message = inputValue.trim()
    setInputValue("")

    await handleSendMessage({
      type: "text",
      message,
    })
  }

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev)
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

  const shouldShowOnboarding = showOnboarding || (isEmbedded && messages.length === 0);

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && !isDirectMode && (!hideToggle || isEmbedded) && (
        <Button
          onClick={() => {
            setIsOpen(true)
            // Reset manuallyClosed flag when user opens chat
            const state = {
              messages,
              isOpen: true,
              lastActivity: Date.now(),
              manuallyClosed: false, // Reset the manual close flag
            }
            ChatStateService.saveState(state)
            
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
            "fixed bottom-[20px] right-[20px]",
          )}
          size="icon"
          style={{
            boxShadow: "0 8px 32px rgba(37, 99, 235, 0.3)",
            backgroundColor: chatbotProps.closedWindow.backgroundColor,
            borderColor: chatbotProps.closedWindow.borderColor
          }}
        >
          <MessageCircleIcon />
        </Button>
      )}

      {/* Chat Window */}
      <div
        className={cn(
          // --- START: MODIFIED LOGIC ---
          // This is the core logic that was fixed.
          // It now handles the background color based on the open state when embedded.
          isEmbedded
            ? // If EMBEDDED, the background depends on whether the chat is open or closed.
              cn(
                "relative h-full w-full grid grid-rows-[auto_1fr_auto] overflow-hidden",
                isOpen ? "bg-white dark:bg-gray-900" : "bg-transparent"
              )
            : // If NOT EMBEDDED, it uses the standard solid background with shadows and borders.
              "bg-white dark:bg-gray-900 rounded-xl shadow-2xl border backdrop-blur-sm border-gray-200 dark:border-gray-700",
          // --- END: MODIFIED LOGIC ---

          // This visibility logic remains unchanged. It controls the scale/opacity transition.
          isOpen || hideToggle ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none",
          
          // This positioning and sizing logic for non-embedded modes remains unchanged.
          isEmbedded ? "" : isFullscreen && !isMobile ? "fixed inset-0 w-full h-screen rounded-none" : isMobile ? `fixed inset-0 rounded-none w-screen h-screen grid grid-rows-[auto_1fr_auto] ${isKeyboardOpen ? 'keyboard-open' : ''}` : isDirectMode || hideToggle ? "absolute inset-0 w-full h-full grid grid-rows-[auto_1fr_auto]" : "fixed bottom-6 right-6 w-[500px] h-[800px] grid grid-rows-[auto_1fr_auto]",

          // These are universal classes that apply in almost all states.
          "transition-all duration-300 z-[9999]"
        )}
        style={
          // The inline style logic does not need to be changed.
          isEmbedded
            ? {
                position: "relative",
                width: "100%",
                height: "100%",
                margin: 0,
                padding: 0,
                boxSizing: "border-box",
                overflow: "hidden",
              }
            : isFullscreen && !isMobile
              ? {
                  transformOrigin: "center",
                  boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                  width: "100vw",
                  height: "100vh",
                  margin: 0,
                  padding: 0,
                  boxSizing: "border-box",
                  overflow: "hidden",
                }
              : isMobile
                ? {
                    height: `${viewportHeight - (isKeyboardOpen ? keyboardHeight : 0)}px`,
                    maxHeight: `${viewportHeight - (isKeyboardOpen ? keyboardHeight : 0)}px`,
                    transformOrigin: "center",
                    boxShadow: "none",
                    margin: 0,
                    padding: 0,
                    width: "100vw",
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
                      maxHeight: "100vh",
                      minHeight: "auto",
                      boxSizing: "border-box",
                    }
                  : {
                      transformOrigin: "bottom right",
                      boxShadow: "0 8px 32px rgba(37, 99, 235, 0.3)",
                      width: "500px",
                      height: "min(800px, calc(100vh - 2rem))",
                      maxHeight: "calc(100vh - 2rem)",
                      boxSizing: "border-box",
                    }
        }
      >
        <ChatHeader
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          messages={messages}
          isPreview={isPreview}
          isMobile={isMobile}
          hideToggle={hideToggle}
          chatbotProps={chatbotProps}
          clearChatHistory={clearChatHistory}
          isEmbedded={isEmbedded}
        />

        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          chatbotProps={chatbotProps}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          handleAddToCartSuccess={handleAddToCartSuccess}
          isMobile={isMobile}
          isKeyboardOpen={isKeyboardOpen}
          keyboardHeight={keyboardHeight}
          viewportHeight={viewportHeight}
          isEmbedded={isEmbedded}
        />

        {shouldShowOnboarding ? (
          <OnboardingForm
            onSubmit={() => setShowOnboarding(false)}
            chatbotProps={chatbotProps}
          />
        ) : (
          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            isLoading={isLoading}
            isPreview={isPreview}
            handleSendText={handleSendText}
            handleKeyPress={handleKeyPress}
            chatbotProps={chatbotProps}
            isMobile={isMobile}
            isKeyboardOpen={isKeyboardOpen}
            keyboardHeight={keyboardHeight}
          />
        )}
      </div>

      {/* Cart Confirmation Popup */}
      
    </>
  )
}