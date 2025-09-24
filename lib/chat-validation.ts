import { type NextRequest, NextResponse } from "next/server"

export interface ChatRequest {
  type: "text" | "voice"
  message?: string
  audioData?: string
  timestamp?: number
  shopify_y?: string
  cart_currency?: string
  localization?: string
  user?: {
    name: string
    email: string
    phone: string
  }
}

export interface ChatResponse {
  message: string
  event_type: string
  product_id?: string
  product_name?: string
  order_id?: string
  currency?: string
  cards?: Array<{
    id: string
    variantId: string
    name: string
    image: string
    images?: string[]
    price: string
    compareAtPrice?: string
    url: string
    currency?: string
    variants: Array<{
      size: string
      color: string
      variantId: string
      price?: string
      compareAtPrice?: string
    }>
  }>
  order?: {
    id: string;
    order_number: number;
    created_at: string;
    fulfillment_status: string | null;
    tracking: {
      carrier: string | null;
      tracking_number: string | null;
      tracking_url: string | null;
    };
    items: Array<{
      product_id: string;
      title: string;
      price: string;
      variant_id: string;
      quantity: number;
    }>;
    customer: {
      name: string;
      email: string | null;
      phone: string | null;
    };
    shipping_address: {
      address1: string;
      address2: string;
      city: string;
      province: string;
      zip: string;
      country: string;
    };
    payment_method: string;
    currency?: string;
  }
}

export async function validateRequest(request: NextRequest): Promise<{ validBody: ChatRequest } | NextResponse> {
  console.log("[v0] =================================")
  console.log("[v0] NEW CHAT REQUEST RECEIVED")
  console.log("[v0] =================================")

  try {
    const body: ChatRequest = await request.json()
    console.log("[v0] Parsed request body:", JSON.stringify(body, null, 2))

    // Validate request
    if (!body.type || !["text", "voice"].includes(body.type)) {
      console.log("[v0] Validation failed: Invalid or missing type field")
      return NextResponse.json({ error: "Invalid or missing type field" }, { status: 422 })
    }

    if (body.type === "text" && !body.message) {
      console.log("[v0] Validation failed: Message is required for text type")
      return NextResponse.json({ error: "Message is required for text type" }, { status: 422 })
    }

    if (body.type === "voice" && (!body.audioData || !body.timestamp)) {
      console.log("[v0] Validation failed: audioData and timestamp are required for voice type")
      return NextResponse.json({ error: "audioData and timestamp are required for voice type" }, { status: 422 })
    }

    console.log("[v0] Request validation passed ✓")

    return { validBody: body }
  } catch (error) {
    console.error("[v0] Request parsing error:", error)
    console.error("[v0] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 })
  }
}