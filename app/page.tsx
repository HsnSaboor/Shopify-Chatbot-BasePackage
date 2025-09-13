"use client"

import { useState, useEffect } from "react"
import { ChatbotWidget } from "@/components/chatbot-widget"

interface ChatbotConfig {
  headerBackgroundColor: string;
  headerBackgroundGradient: string;
  agentName: string;
  chatbotTagline: string;
  avatarImageUrl: string;
  avatarBorderRadius: number;
  avatarBorderWidth: number;
  avatarBorderColor: string;
  messageBackgroundColor: string;
  messageBackgroundGradient: string;
  chatbotApiUrl: string;
  floatingButtonColor: string;
  n8nWebhookUrl: string;
}

export default function Home() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config/default'); // Load default config
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
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Chatbot...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error loading Chatbot: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Our Store</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Chat with our AI assistant to find the perfect products for you
          </p>
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Featured Products</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Browse our collection or ask our AI assistant for personalized recommendations. Click the chat icon in the
              bottom right to get started!
            </p>
          </div>
        </div>
      </div>

      {config && <ChatbotWidget {...config} />}
    </div>
  )
}
