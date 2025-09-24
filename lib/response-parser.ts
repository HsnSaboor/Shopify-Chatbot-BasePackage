import { NextResponse } from "next/server"
import type { ChatResponse } from "./chat-validation"

function parseVariant(variant: any, product?: any): {
  size: string
  color: string
  variantId: string
  price?: string
  compareAtPrice?: string
} {
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
    price: variant.price?.toString() || (product ? product.price?.toString() : '0'),
    compareAtPrice: variant.compare_at_price?.toString() || (product ? (product.compare_at_price ? product.compare_at_price.toString() : undefined) : undefined),
  };
}

export async function parseResponse(responseText: string): Promise<ChatResponse | NextResponse> {
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
        currency: webhookData.currency || 'USD',
      };
    }

    // Transform products to cards array
    let transformedCards: ChatResponse['cards'] = [];
    const rawProducts = webhookData.cards || webhookData.products;
    if (rawProducts) {
      const currency = webhookData.currency || 'USD';
      if (Array.isArray(rawProducts)) {
        // If already an array, map each to ProductCardData
        transformedCards = rawProducts.map((product: any) => ({
          id: product.id?.toString() || '',
          variantId: product.variant_id?.toString() || product.id?.toString() || '',
          name: product.title || product.name || '',
          image: product.image_url || product.images?.[0] || product.image || '',
          images: product.images || [],
          price: product.price?.toString() || '0',
          compareAtPrice: product.compare_at_price ? product.compare_at_price.toString() : undefined,
          url: product.product_url || product.url || '',
          currency,
          variants: (product.variants || product.sizes || []).map((variant: any) => parseVariant(variant, product)),
        }));
      } else if (typeof rawProducts === 'object' && rawProducts !== null) {
        // If single object, wrap in array and transform
        transformedCards = [{
          id: rawProducts.id?.toString() || '',
          variantId: rawProducts.variant_id?.toString() || rawProducts.id?.toString() || '',
          name: rawProducts.title || rawProducts.name || '',
          image: rawProducts.image_url || rawProducts.images?.[0] || rawProducts.image || '',
          images: rawProducts.images || [],
          price: rawProducts.price?.toString() || '0',
          compareAtPrice: rawProducts.compare_at_price ? rawProducts.compare_at_price.toString() : undefined,
          url: rawProducts.product_url || rawProducts.url || '',
          currency,
          variants: (rawProducts.variants || rawProducts.sizes || []).map((variant: any) => parseVariant(variant, rawProducts)),
        }];
      }
    }

    data = {
      message: webhookData.output?.response || webhookData.response || webhookData.message || "No response received",
      event_type: webhookData.event_type || "message",
      product_id: webhookData.product_id,
      product_name: webhookData.product_name,
      order_id: webhookData.order_id,
      currency: webhookData.currency || 'USD',
      cards: transformedCards,
      order: transformedOrder,
    }

    console.log("[v0] Extracted message:", data.message)

    console.log("[v0] Mapped response data:", JSON.stringify(data, null, 2))

    console.log("[v0] Returning successful response to client")
    console.log("[v0] =================================")

    return data
  } catch (parseError) {
    console.error("[v0] Failed to parse webhook response as JSON:", parseError)
    console.error("[v0] Raw response was:", responseText)
    return NextResponse.json({ error: "Invalid response from chatbot service" }, { status: 500 })
  }
}