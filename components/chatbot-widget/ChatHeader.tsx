"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { XIcon } from "./icons"
import { cn } from "@/lib/utils"
import { ChatStateService } from "@/lib/chat-state"
import type { ChatbotStylingProps } from "../chatbot-widget"

interface ChatHeaderProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: any[]
  isPreview: boolean
  isMobile: boolean
  hideToggle: boolean
  chatbotProps: ChatbotStylingProps
  clearChatHistory: () => void
  isEmbedded?: boolean
}

export function ChatHeader({
  isOpen,
  setIsOpen,
  messages,
  isPreview,
  isMobile,
  hideToggle,
  chatbotProps,
  clearChatHistory,
  isEmbedded = false,
}: ChatHeaderProps) {
  const isEmbeddedMobile = isEmbedded && isMobile
  return (
    <div
      className={cn("flex items-center justify-between p-4 border-b",
        (isMobile || isEmbedded) ? "rounded-none" : "rounded-t-xl")}
      style={{
        backgroundColor: chatbotProps.chatHeader.backgroundColor,
        color: "white",
        paddingTop: isEmbeddedMobile ? "calc(1rem + env(safe-area-inset-top))" : "1rem",
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar className={`h-8 w-8 ${chatbotProps.avatar.showBorder ? 'ring-2 ring-white/20' : ''}`}>
          <AvatarImage
            src={chatbotProps.avatar.imageUrl}
            alt="Chatbot Avatar"
            className="h-full w-full object-cover rounded-full"
            style={{ border: chatbotProps.avatar.borderStyle }}
          />
        </Avatar>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: "white" }}>
            {chatbotProps.chatHeader.name}
            {isPreview && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-white text-xs">
                Preview
              </Badge>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-xs" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              {isPreview ? "Demo Mode" : chatbotProps.chatHeader.tagline}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {(!isMobile && !isEmbedded) && (
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
              // Save state with manuallyClosed flag
              const state = {
                messages,
                isOpen: false,
                lastActivity: Date.now(),
                manuallyClosed: true, // User explicitly closed the chat
              }
              ChatStateService.saveState(state)
              
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
            title={isEmbeddedMobile ? "Minimize" : "Close"}
          >
            {isEmbeddedMobile ? (
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
  )
}