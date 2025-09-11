"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, ShoppingCart, Sparkles, Zap } from "lucide-react"
import { ChatbotWidget } from "@/components/chatbot-widget"

const mockMessages = [
  {
    id: "1",
    role: "assistant" as const,
    content: "Hello! Welcome to our store! I'm your AI shopping assistant. How can I help you today?",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "2",
    role: "user" as const,
    content: "I'm looking for a comfortable t-shirt for summer",
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: "3",
    role: "assistant" as const,
    content: "Perfect! I've found some great summer t-shirts for you. Here are my top recommendations:",
    timestamp: new Date(Date.now() - 180000),
    products: [
      {
        id: "demo-tshirt-1",
        title: "Premium Cotton T-Shirt",
        price: 2999,
        compareAtPrice: 3999,
        image: "/placeholder.svg?height=300&width=300&text=Premium+Cotton+Tee",
        url: "/products/premium-cotton-tshirt",
        variants: [
          { id: "color-white", name: "Pure White", type: "color", value: "#FFFFFF", variantId: "var-white" },
          { id: "color-black", name: "Midnight Black", type: "color", value: "#000000", variantId: "var-black" },
          { id: "color-navy", name: "Navy Blue", type: "color", value: "#1e3a8a", variantId: "var-navy" },
          { id: "color-sage", name: "Sage Green", type: "color", value: "#10B981", variantId: "var-sage" },
          { id: "size-s", name: "Small", type: "size", value: "S", variantId: "var-s" },
          { id: "size-m", name: "Medium", type: "size", value: "M", variantId: "var-m" },
          { id: "size-l", name: "Large", type: "size", value: "L", variantId: "var-l" },
          { id: "size-xl", name: "X-Large", type: "size", value: "XL", variantId: "var-xl" },
        ],
      },
      {
        id: "demo-tshirt-2",
        title: "Organic Bamboo Tee",
        price: 3499,
        compareAtPrice: 4499,
        image: "/placeholder.svg?height=300&width=300&text=Bamboo+Tee",
        url: "/products/organic-bamboo-tee",
        variants: [
          { id: "color-sage", name: "Sage Green", type: "color", value: "#22c55e", variantId: "bamboo-sage" },
          { id: "color-cream", name: "Cream", type: "color", value: "#fef3c7", variantId: "bamboo-cream" },
          {
            id: "color-charcoal",
            name: "Charcoal Gray",
            type: "color",
            value: "#374151",
            variantId: "bamboo-charcoal",
          },
          { id: "color-ocean", name: "Ocean Blue", type: "color", value: "#0ea5e9", variantId: "bamboo-ocean" },
          { id: "size-s", name: "Small", type: "size", value: "S", variantId: "bamboo-s" },
          { id: "size-m", name: "Medium", type: "size", value: "M", variantId: "bamboo-m" },
          { id: "size-l", name: "Large", type: "size", value: "L", variantId: "bamboo-l" },
          { id: "size-xl", name: "X-Large", type: "size", value: "XL", variantId: "bamboo-xl" },
        ],
      },
    ],
  },
  {
    id: "4",
    role: "user" as const,
    content: "The bamboo tee looks great! What makes it special?",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "5",
    role: "assistant" as const,
    content:
      "Great choice! The Organic Bamboo Tee is made from 100% sustainable bamboo fiber, which is naturally antibacterial, moisture-wicking, and incredibly soft. It's perfect for hot summer days and gets softer with each wash. Plus, bamboo is one of the most eco-friendly materials available!",
    timestamp: new Date(Date.now() - 60000),
  },
]

const features = [
  {
    icon: MessageCircle,
    title: "AI-Powered Conversations",
    description: "Natural language processing for seamless customer interactions",
  },
  {
    icon: ShoppingCart,
    title: "Shopify Integration",
    description: "Direct cart integration with variant selection and quantity controls",
  },
  {
    icon: Sparkles,
    title: "Product Recommendations",
    description: "Smart product suggestions based on customer preferences",
  },
  {
    icon: Zap,
    title: "Instant Responses",
    description: "Real-time chat with voice message support and state persistence",
  },
]

export default function PreviewPage() {
  const [showDemo, setShowDemo] = useState(false)
  const [demoStep, setDemoStep] = useState(0)

  const startDemo = () => {
    setShowDemo(true)
    setDemoStep(0)
  }

  const nextDemoStep = () => {
    setDemoStep((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">AI Chatbot Widget</h1>
                <p className="text-sm text-slate-600">Shopify Integration Preview</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Live Preview
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold text-slate-900 mb-6 text-balance">
            Experience the Future of E-commerce Customer Support
          </h2>
          <p className="text-xl text-slate-600 mb-8 text-pretty">
            See how our AI chatbot transforms customer interactions with intelligent product recommendations, seamless
            cart integration, and persistent conversation state.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={startDemo} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Sparkles className="w-5 h-5 mr-2" />
              Start Interactive Demo
            </Button>
            <Button variant="outline" size="lg">
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center text-slate-900 mb-12">Powerful Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-pretty">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Instructions */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900">Try the Interactive Demo</CardTitle>
              <CardDescription className="text-blue-700">
                Click the chat button in the bottom right to experience all features:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-3">What you can test:</h4>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Product recommendations with variants
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Add to cart functionality
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Success confirmation popups
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Voice message recording
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Persistent conversation state
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-3">Sample interactions:</h4>
                  <ul className="space-y-2 text-blue-800">
                    <li className="italic">"Show me summer t-shirts"</li>
                    <li className="italic">"I need running shoes"</li>
                    <li className="italic">"What's on sale today?"</li>
                    <li className="italic">"Help me find a gift"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <ChatbotWidget
        isPreview={true}
        mockMessages={mockMessages}
        onMockInteraction={(action, data) => {
          console.log("[v0] Mock interaction:", action, data)
          // Handle mock interactions for demo purposes
        }}
      />
    </div>
  )
}
