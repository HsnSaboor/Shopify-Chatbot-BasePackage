"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, ShoppingCart, Sparkles, Zap, Eye } from "lucide-react"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { OrderCard } from "@/components/order-card"

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

const mockOrder = {
  id: "5987238871087",
  order_number: 1004,
  created_at: new Date().toISOString(),
  fulfillment_status: "fulfilled",
  items: [
    {
      product_id: "7929446826031",
      title: "Zenmato T-Shirt Bundle",
      price: "105.00",
      variant_id: "43609653575727",
      quantity: 1,
    },
  ],
  customer: {
    name: "Hassan",
    email: "hassan@example.com",
    phone: "+923202233656",
  },
  shipping_address: {
    name: "Saboor",
    address1: "Stree6",
    address2: "",
    city: "Gujranwala",
    province: "",
    zip: "",
    country: "Pakistan",
  },
  payment_method: "bogus",
}

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

const CartPopupPreview = ({ show, onClose }: { show: boolean; onClose: () => void }) => {
  if (!show) return null;

  const cart = {
    items: [
      { title: "Premium Cotton T-Shirt", price: 2999 },
      { title: "Organic Bamboo Tee", price: 3499 },
      { title: "Fitness Watch", price: 19999 },
    ],
    item_count: 5,
    total_price: 26496,
    currency: "USD",
  };

  const formatPrice = (price: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD'
      }).format(price / 100);
    } catch (error) {
      return `$${(price / 100).toFixed(2)}`;
    }
  };

  const cartItemsHTML = cart.items && Array.isArray(cart.items) && cart.items.length > 0 
    ? cart.items.slice(0, 3).map((item) => `
        <div class="flex justify-between text-sm text-gray-600">
          <span class="truncate flex-1 mr-2">${item.title}</span>
          <span class="font-medium text-gray-900">${formatPrice(item.price, cart.currency)}</span>
        </div>
      `).join('') + (cart.items.length > 3 ? `<p class="text-xs text-gray-500 mt-2">+${cart.items.length - 3} more items</p>` : '')
    : '<p class="text-sm text-gray-500">No items in cart</p>';

  const innerContent = `
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
      <div class="text-center pb-4 pt-6 px-6">
        <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-green-700">Added to Cart!</h3>
        <p class="text-sm text-gray-600">This is a preview</p>
      </div>

      <div class="px-6 pb-6 space-y-4">
        <!-- Cart Summary -->
        <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium flex items-center gap-2 text-gray-800">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L23 6H6" />
              </svg>
              Cart Summary
            </h4>
            <span class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">
              ${cart.item_count} ${cart.item_count === 1 ? "item" : "items"}
            </span>
          </div>

          <div class="space-y-2 max-h-32 overflow-y-auto pr-2">
            ${cartItemsHTML}
          </div>

          <div class="border-t border-gray-200 pt-3 mt-3">
            <div class="flex justify-between items-center text-lg font-bold text-gray-900">
              <span>Total:</span>
              <span>${formatPrice(cart.total_price, cart.currency)}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button class="flex-1 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            View Cart
          </button>
          <button class="flex-1 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
            Checkout
          </button>
        </div>

        <button id="close-popup-btn-preview" class="w-full inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mt-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m18 6-12 12" />
            <path d="m6 6 12 12" />
          </svg>
          <span class="ml-2">Close</span>
        </button>
      </div>
    </div>
  `;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md mx-4" dangerouslySetInnerHTML={{ __html: innerContent }} />
    </div>
  );
};


export default function PreviewPage() {
  const [showDemo, setShowDemo] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  const startDemo = () => {
    setShowDemo(true)
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
            <Button variant="outline" size="lg" onClick={() => setShowPopup(true)}>
              <Eye className="w-5 h-5 mr-2" />
              Preview Cart Popup
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

      {/* Order Card Preview */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center text-slate-900 mb-12">Order Card Preview</h3>
          <div className="flex justify-center">
            <OrderCard order={mockOrder} />
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

      <CartPopupPreview show={showPopup} onClose={() => setShowPopup(false)} />
    </div>
  )
}