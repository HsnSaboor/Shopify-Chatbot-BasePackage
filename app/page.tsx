import { ChatbotWidget } from "@/components/chatbot-widget"

export default function Home() {
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

      <ChatbotWidget />
    </div>
  )
}
