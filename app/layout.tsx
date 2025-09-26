import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

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
    <html lang="en" className={`${inter.variable} m-0 p-0 w-full h-full overflow-auto`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content" />
        <style dangerouslySetInnerHTML={{ __html: `
          html {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: auto !important;
            box-sizing: border-box !important;
          }
          body {
            font-family: var(--font-inter), sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: transparent !important;
            color: oklch(0.145 0 0) !important;
            box-sizing: border-box !important;
          }
          * {
            box-sizing: border-box !important;
          }
        ` }} />
      </head>
      <body className="font-sans m-0 p-0 w-full h-full">
        <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
      </body>
    </html>
  )
}
