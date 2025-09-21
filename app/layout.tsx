import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Shopify Chatbot",
  description: "A redistributable Shopify AI chatbot widget",
  generator: "Next.js",
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="m-0 p-0 w-full h-full overflow-auto">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans m-0 p-0 w-full h-full">
        <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
      </body>
    </html>
  )
}
