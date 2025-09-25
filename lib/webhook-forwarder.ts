import { type NextRequest, NextResponse } from "next/server"
import type { ChatRequest } from "./chat-validation"

const webhookUrl = process.env.CHATBOT_WEBHOOK_URL || "__WEBHOOK_URL_PLACEHOLDER__";

export async function forwardToWebhook(body: ChatRequest, request: NextRequest): Promise<{ responseText: string } | NextResponse> {
  console.log("[v0] Using webhook URL:", webhookUrl)

  // Forward request to the actual webhook
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Request-ID": request.headers.get("X-Request-ID") || crypto.randomUUID(),
    }

    console.log("[v0] Request headers:", JSON.stringify(headers, null, 2))
    console.log("[v0] Request payload:", JSON.stringify(body, null, 2))
    console.log("[v0] Making webhook request to:", webhookUrl)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("[v0] Webhook response status:", response.status)
    console.log(
      "[v0] Webhook response headers:",
      JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2),
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.error("[v0] Webhook error response:", errorText)
      console.error("[v0] Webhook error status:", response.status)

      if (response.status === 401) {
        return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
      }

      return NextResponse.json({ error: "Chatbot service error" }, { status: 500 })
    }

    const responseText = await response.text()
    console.log("[v0] Raw webhook response:", responseText)

    return { responseText }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === "AbortError") {
      console.error("[v0] Request timeout after 15 seconds")
      return NextResponse.json({ error: "Request timeout" }, { status: 504 })
    }

    console.error("[v0] Network error:", error)
    console.error("[v0] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: "Network error occurred" }, { status: 500 })
  }
}