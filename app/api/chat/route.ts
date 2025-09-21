import { type NextRequest, NextResponse } from "next/server"

const webhookUrl = process.env.CHATBOT_WEBHOOK_URL || "https://n8n.botomation.tech/webhook-test/chat" || "__WEBHOOK_URL_PLACEHOLDER__";

interface ChatRequest {
  type: "text" | "voice"
  message?: string
  audioData?: string
  timestamp?: number
  cart_currency?: string
  localization?: string
}

interface ChatResponse {
  message: string
  event_type: string
  product_id?: string
  product_name?: string
  order_id?: string
  cards?: Array<{
    id: string
    variantId: string
    name: string
    image: string
    images?: string[]
    price: string
    compareAtPrice?: string
    url: string
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
  }
}

export async function POST(request: NextRequest) {
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

      let data: ChatResponse
      try {
        const parsedResponse = JSON.parse(responseText)
        console.log("[v0] Parsed webhook response:", JSON.stringify(parsedResponse, null, 2))

        // If response is an array, take the first item
        let webhookData: any
        if (Array.isArray(parsedResponse)) {
          if (parsedResponse.length === 0) {
            console.error("[v0] Webhook returned empty array")
            return NextResponse.json({ error: "Empty response from chatbot service" }, { status: 500 })
          }
          webhookData = parsedResponse[0]
          console.log("[v0] Using first item from array response:", JSON.stringify(webhookData, null, 2))
        } else {
          webhookData = parsedResponse
          console.log("[v0] Using single object response:", JSON.stringify(webhookData, null, 2))
        }

        // Transform order if present
        let transformedOrder: ChatResponse['order'] | undefined = undefined;
        if (webhookData.order) {
          const rawOrder = webhookData.order;
          const lineItems = rawOrder.line_items || [];
          
          transformedOrder = {
            id: rawOrder.id.toString(),
            order_number: rawOrder.order_number || rawOrder.number || 0,
            created_at: rawOrder.created_at,
            fulfillment_status: rawOrder.fulfillment_status || 'unfulfilled',
            tracking: {
              carrier: rawOrder.fulfillments?.[0]?.tracking_company || null,
              tracking_number: rawOrder.fulfillments?.[0]?.tracking_number || null,
              tracking_url: rawOrder.fulfillments?.[0]?.tracking_url || null,
            },
            items: lineItems.map((item: any) => ({
              product_id: item.product_id?.toString() || '',
              title: item.title,
              price: item.price,
              variant_id: item.variant_id?.toString() || '',
              quantity: item.quantity,
            })),
            customer: {
              name: `${rawOrder.customer?.first_name || ''} ${rawOrder.customer?.last_name || ''}`.trim() || 'Unknown Customer',
              email: rawOrder.customer?.email || null,
              phone: rawOrder.customer?.phone || rawOrder.shipping_address?.phone || null,
            },
            shipping_address: {
              address1: rawOrder.shipping_address?.address1 || '',
              address2: rawOrder.shipping_address?.address2 || '',
              city: rawOrder.shipping_address?.city || '',
              province: rawOrder.shipping_address?.province || '',
              zip: rawOrder.shipping_address?.zip || '',
              country: rawOrder.shipping_address?.country || '',
            },
            payment_method: rawOrder.payment_gateway_names?.[0] || rawOrder.financial_status || 'Unknown',
          };
        }

        // Transform products to cards array
        let transformedCards: ChatResponse['cards'] = [];
        const rawProducts = webhookData.cards || webhookData.products;
        if (rawProducts) {
          if (Array.isArray(rawProducts)) {
            // If already an array, map each to ProductCardData
            transformedCards = rawProducts.map((product: any) => {
              // Parse variant color and size more robustly
              const parseVariant = (variant: any) => {
                let variantColor = '';
                let variantSize = '';
                if (variant.options && Array.isArray(variant.options) && variant.options.length >= 2) {
                  variantColor = variant.options[0].trim();
                  variantSize = variant.options[1].trim();
                } else if (variant.variant_title && variant.variant_title.includes('/')) {
                  // Split on / with optional spaces around it
                  const title = variant.variant_title.trim();
                  const parts = title.split(/\s*\/\s*/);
                  if (parts.length >= 2) {
                    variantColor = parts[0].trim();
                    variantSize = parts.slice(1).join(' / ').trim();
                  } else {
                    variantSize = title;
                  }
                } else {
                  variantSize = (variant.options?.[0] || variant.size || '').trim();
                }
                return {
                  size: variantSize,
                  color: variantColor,
                  variantId: variant.variant_id?.toString() || variant.variantId?.toString() || '',
                  price: variant.price?.toString() || product.price?.toString() || '0',
                  compareAtPrice: variant.compare_at_price?.toString() || (product.compare_at_price ? product.compare_at_price.toString() : undefined),
                };
              };

              return {
                id: product.id?.toString() || '',
                variantId: product.variant_id?.toString() || product.id?.toString() || '',
                name: product.title || product.name || '',
                image: product.image_url || product.images?.[0] || product.image || '',
                images: product.images || [],
                price: product.price?.toString() || '0',
                compareAtPrice: product.compare_at_price ? product.compare_at_price.toString() : undefined,
                url: product.product_url || product.url || '',
                variants: (product.variants || product.sizes || []).map(parseVariant),
              };
            });
          } else if (typeof rawProducts === 'object' && rawProducts !== null) {
            // If single object, wrap in array and transform
            // Parse variant color and size more robustly
            const parseVariant = (variant: any) => {
              let variantColor = '';
              let variantSize = '';
              if (variant.options && Array.isArray(variant.options) && variant.options.length >= 2) {
                variantColor = variant.options[0].trim();
                variantSize = variant.options[1].trim();
              } else if (variant.variant_title && variant.variant_title.includes('/')) {
                // Split on / with optional spaces around it
                const title = variant.variant_title.trim();
                const parts = title.split(/\s*\/\s*/);
                if (parts.length >= 2) {
                  variantColor = parts[0].trim();
                  variantSize = parts.slice(1).join(' / ').trim();
                } else {
                  variantSize = title;
                }
              } else {
                variantSize = (variant.options?.[0] || variant.size || '').trim();
              }
              return {
                size: variantSize,
                color: variantColor,
                variantId: variant.variant_id?.toString() || variant.variantId?.toString() || '',
                price: variant.price?.toString() || rawProducts.price?.toString() || '0',
                compareAtPrice: variant.compare_at_price?.toString() || (rawProducts.compare_at_price ? rawProducts.compare_at_price.toString() : undefined),
              };
            };

            transformedCards = [{
              id: rawProducts.id?.toString() || '',
              variantId: rawProducts.variant_id?.toString() || rawProducts.id?.toString() || '',
              name: rawProducts.title || rawProducts.name || '',
              image: rawProducts.image_url || rawProducts.images?.[0] || rawProducts.image || '',
              images: rawProducts.images || [],
              price: rawProducts.price?.toString() || '0',
              compareAtPrice: rawProducts.compare_at_price ? rawProducts.compare_at_price.toString() : undefined,
              url: rawProducts.product_url || rawProducts.url || '',
              variants: (rawProducts.variants || rawProducts.sizes || []).map(parseVariant),
            }];
          }
        }

        data = {
          message: webhookData.output?.response || webhookData.response || webhookData.message || "No response received",
          event_type: webhookData.event_type || "message",
          product_id: webhookData.product_id,
          product_name: webhookData.product_name,
          order_id: webhookData.order_id,
          cards: transformedCards,
          order: transformedOrder,
        }

        console.log("[v0] Extracted message:", data.message)

        console.log("[v0] Mapped response data:", JSON.stringify(data, null, 2))
      } catch (parseError) {
        console.error("[v0] Failed to parse webhook response as JSON:", parseError)
        console.error("[v0] Raw response was:", responseText)
        return NextResponse.json({ error: "Invalid response from chatbot service" }, { status: 500 })
      }

      console.log("[v0] Returning successful response to client")
      console.log("[v0] =================================")
      return NextResponse.json(data)
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