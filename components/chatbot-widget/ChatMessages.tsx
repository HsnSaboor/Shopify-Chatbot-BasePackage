"use client"

import React, { useRef, useEffect } from "react"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { LoaderIcon } from "./icons"
import { cn } from "@/lib/utils"
import { ProductCard } from "@/components/product-card"
import { OrderCard } from "@/components/order-card"
import type { Message } from "./types"
import type { ChatbotStylingProps } from "../chatbot-widget"

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  chatbotProps: ChatbotStylingProps
  isFullscreen: boolean
  toggleFullscreen: () => void
  handleAddToCartSuccess: (cart: any) => void
  isMobile: boolean
  isKeyboardOpen: boolean
  keyboardHeight: number
  viewportHeight: number
  isEmbedded?: boolean
}

export function ChatMessages({
  messages,
  isLoading,
  chatbotProps,
  isFullscreen,
  toggleFullscreen,
  handleAddToCartSuccess,
  isMobile,
  isKeyboardOpen,
  keyboardHeight,
  viewportHeight,
  isEmbedded = false,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Maintain scroll position when keyboard opens/closes
  useEffect(() => {
    if (isMobile && !isEmbedded) {
      // Small delay to ensure DOM has updated
      const timer = setTimeout(() => {
        scrollToBottom()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isKeyboardOpen, isMobile])

  return (
    <div
      className="relative flex-1 overflow-y-auto min-h-0"
      style={
        (isMobile && !isEmbedded)
          ? {
              height: `${viewportHeight - (isKeyboardOpen ? keyboardHeight : 0)}px`,
              maxHeight: `${viewportHeight - (isKeyboardOpen ? keyboardHeight : 0)}px`,
            }
          : {}
      }
    >
      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              <div className={cn("flex items-start gap-3", message.type === "user" ? "justify-end" : "justify-start")}>
                {message.type === "bot" && (
                  <Avatar className={`h-8 w-8 flex-shrink-0 ${chatbotProps.avatar.showBorder ? 'ring-2 ring-blue-100' : ''}`}>
                    <AvatarImage
                      src={chatbotProps.avatar.imageUrl}
                      alt="Chatbot Avatar"
                      className="h-full w-full rounded-full object-cover"
                      style={{ border: chatbotProps.avatar.borderStyle }}
                    />
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    message.type === "user"
                      ? "ml-auto bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50 shadow-sm",
                  )}
                  style={
                    message.type === "user"
                      ? { backgroundColor: chatbotProps.userMessage.backgroundColor, color: "white" }
                      : {}
                  }
                >
                  <p className="text-pretty">{message.content}</p>
                </div>
              </div>

              {/* Product Cards */}
              {((message.cards && message.cards.length > 0) || (message.products && message.products.length > 0)) && (
                <div className={cn("space-y-3", message.type === "bot" ? "ml-11" : "")}>
                  {(message.cards || message.products || []).map((product: any) => (
                    <ProductCard key={product.id} product={product} currency={product.currency || message.currency || "PKR"} onAddToCart={handleAddToCartSuccess} isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />
                  ))}
                </div>
              )}

              {/* Order Card */}
              {message.order && Object.keys(message.order).length > 0 && (
                <div className={cn("space-y-3", message.type === "bot" ? "ml-11" : "")}>
                  <OrderCard order={message.order} />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <Avatar className={`h-8 w-8 flex-shrink-0 ${chatbotProps.avatar.showBorder ? 'ring-2 ring-blue-100' : ''}`}>
                <AvatarImage
                  src={chatbotProps.avatar.imageUrl}
                  alt="Chatbot Avatar"
                  className="h-full w-full rounded-full object-cover"
                  style={{ border: chatbotProps.avatar.borderStyle }}
                />
              </Avatar>
              <div className="rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-50">
                <div className="flex items-center gap-2">
                  <LoaderIcon />
                  <span>{chatbotProps.chatHeader.name} is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}