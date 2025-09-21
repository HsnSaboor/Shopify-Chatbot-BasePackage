"use client"

import { useState, useEffect } from "react"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { ProductCard } from "@/components/product-card"

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Mock products data from webhook
  const mockProducts = [
    {
      id: "7927670472751",
      title: "Toji Redemption Oversize Tee",
      image: "https://cdn.shopify.com/s/files/1/0633/0915/2303/files/pixelcut-export_39_a06ced8c-e8b3-4fd6-9ef7-69a095a8949d.png?v=1739967473",
      images: [
        "https://cdn.shopify.com/s/files/1/0633/0915/2303/files/pixelcut-export_40.png?v=1739967473"
      ],
      price: "30",
      url: "https://zenmato.myshopify.com/products/toji-redemption-oversize-tee",
      variants: [
        { size: "S", variantId: "43602302763055", price: "30.00" },
        { size: "M", variantId: "43602302795823", price: "30.00" },
        { size: "L", variantId: "43602302828591", price: "30.00" },
        { size: "XL", variantId: "43602302861359", price: "30.00" },
        { size: "2XL", variantId: "43602302894127", price: "30.00" }
      ]
    },
    {
      id: "7927670800431",
      title: "Toji Spear of Heaven Tee",
      image: "https://cdn.shopify.com/s/files/1/0633/0915/2303/files/pixelcut-export_6bc2c443-d4fb-4776-bd70-af28737b9e03.png?v=1739967401",
      images: [
        "https://cdn.shopify.com/s/files/1/0633/0915/2303/files/pixelcut-export_1_b346d468-08f4-46bb-bc5d-948a3e3deaa7.png?v=1739875465",
        "https://cdn.shopify.com/s/files/1/0633/0915/2303/files/IMG_2789-2.jpg?v=1739875465",
        "https://cdn.shopify.com/s/files/1/0633/0915/2303/files/IMG_2797.jpg?v=1739875465"
      ],
      price: "17.6",
      compareAtPrice: "22",
      url: "https://zenmato.myshopify.com/products/toji-spear-of-heaven-tee",
      variants: [
        { size: "XS", variantId: "43602304139311", price: "17.60", compareAtPrice: "22.00" },
        { size: "S", variantId: "43602304172079", price: "17.60", compareAtPrice: "22.00" },
        { size: "M", variantId: "43602304204847", price: "17.60", compareAtPrice: "22.00" },
        { size: "L", variantId: "43602304237615", price: "17.60", compareAtPrice: "22.00" },
        { size: "XL", variantId: "43602304270383", price: "17.60", compareAtPrice: "22.00" }
      ]
    }
  ]

  // Don't render the chatbot on the server side to avoid hydration issues
  if (!isClient) {
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
      </div>
    )
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

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-8">Product Preview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {mockProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>

      <ChatbotWidget />
    </div>
  )
}