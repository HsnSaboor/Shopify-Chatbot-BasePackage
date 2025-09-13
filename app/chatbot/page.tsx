"use client"

import { Suspense, useState, useEffect } from "react"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { useSearchParams } from "next/navigation"

function ChatbotContent() {
  const searchParams = useSearchParams()
  const configFilename = searchParams.get("config") || "default";

  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`/api/config/${configFilename}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setConfig(data);
      } catch (e: any) {
        setError(e);
        console.error("Failed to load chatbot config:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, [configFilename]);

  if (isLoading) {
    return <div className="flex items-center justify-center w-full h-full">Loading Chatbot...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center w-full h-full text-red-500">Error loading Chatbot: {error.message}</div>;
  }

  return (
    <div className="bg-transparent overflow-hidden">
      {config && <ChatbotWidget {...config} />}
    </div>
  )
}

export default function ChatbotPage() {
  return (
    <Suspense fallback={<div />}>
      <ChatbotContent />
    </Suspense>
  )
}
