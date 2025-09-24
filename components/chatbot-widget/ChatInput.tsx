"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SendIcon } from "./icons"
import { cn } from "@/lib/utils"
import type { ChatbotStylingProps } from "../chatbot-widget"

interface ChatInputProps {
  inputValue: string
  setInputValue: (value: string) => void
  isLoading: boolean
  isPreview: boolean
  handleSendText: () => void
  handleKeyPress: (e: React.KeyboardEvent) => void
  chatbotProps: ChatbotStylingProps
  isMobile: boolean
  isKeyboardOpen: boolean
  keyboardHeight: number
}

export function ChatInput({
  inputValue,
  setInputValue,
  isLoading,
  isPreview,
  handleSendText,
  handleKeyPress,
  chatbotProps,
  isMobile,
  isKeyboardOpen,
  keyboardHeight,
}: ChatInputProps) {
  return (
    <div
      className={cn(
        "border-t bg-gray-50/50 dark:bg-gray-800/50",
        isMobile ? "p-4 rounded-none" : "p-6 rounded-b-xl",
      )}
      style={{
        paddingBottom: isMobile ? "calc(1rem + env(keyboard-inset-height, 0px) + env(safe-area-inset-bottom, 0px))" : "1rem",
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
          onClick={handleSendText}
          disabled={!inputValue.trim() || isLoading}
          size="icon"
          className={cn(
            "rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-sm",
            isMobile ? "h-10 w-10" : "h-12 w-12",
          )}
          style={{ backgroundColor: chatbotProps.sendButton.backgroundColor }}
        >
          <SendIcon />
        </Button>
      </div>
      <p className={cn("text-gray-500 dark:text-gray-400 mt-2 text-center", isMobile ? "text-xs" : "text-xs")}>
        {isPreview ? "Preview Mode • Try different messages" : "Press Enter to send"}
      </p>
    </div>
  )
}