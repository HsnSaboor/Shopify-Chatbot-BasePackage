"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

interface OrderCardProps {
  order: {
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
  };
}

export function OrderCard({ order }: OrderCardProps) {
  console.log("[OrderCard] Rendering with order:", order);

  const formattedDate = new Date(order.created_at || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="w-full max-w-md mx-auto md:max-w-sm hover:shadow-lg transition-all duration-200 border-gray-200">
      <CardHeader className="px-3 py-2">
        <CardTitle className="flex justify-between items-center text-base md:text-lg">
          <span>Order #{order.order_number || 'N/A'}</span>
          <Badge variant="default">{order.payment_method || 'Unknown'}</Badge>
        </CardTitle>
        <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
          <span>{formattedDate}</span>
          <span>{order.fulfillment_status || "Unfulfilled"}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        <div className="border-t border-gray-200 pt-3">
          <h4 className="font-semibold text-sm text-gray-900 mb-2">Items</h4>
          <ul className="space-y-1">
            {(order.items || []).map((item) => (
              <li key={item.variant_id} className="flex justify-between text-sm">
                <span className="flex-1 pr-2">{item.title} (x{item.quantity})</span>
                <span className="font-medium">${item.price}</span>
              </li>
            ))}
          </ul>
          {(!order.items || order.items.length === 0) && (
            <p className="text-sm text-gray-500 italic">No items in this order</p>
          )}
        </div>
        <div className="border-t border-gray-200 pt-3">
          <h4 className="font-semibold text-sm text-gray-900 mb-2">Customer</h4>
          <p className="text-sm">{order.customer?.name || 'Unknown Customer'}</p>
          {order.customer?.email && <p className="text-sm text-gray-500">{order.customer.email}</p>}
          {order.customer?.phone && <p className="text-sm text-gray-500">{order.customer.phone}</p>}
        </div>
        <div className="border-t border-gray-200 pt-3">
          <h4 className="font-semibold text-sm text-gray-900 mb-2">Shipping Address</h4>
          <address className="text-sm not-italic">
            <p>{order.shipping_address?.address1 || 'N/A'}</p>
            {order.shipping_address?.address2 && <p>{order.shipping_address.address2}</p>}
            <p>{order.shipping_address?.city || 'N/A'}, {order.shipping_address?.province || 'N/A'} {order.shipping_address?.zip || 'N/A'}</p>
            <p>{order.shipping_address?.country || 'N/A'}</p>
          </address>
        </div>
        {order.tracking && (order.tracking.carrier || order.tracking.tracking_number) && (
          <div className="border-t border-gray-200 pt-3">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">Tracking</h4>
            {order.tracking.carrier && <p className="text-sm">Carrier: {order.tracking.carrier}</p>}
            {order.tracking.tracking_number && (
              <p className="text-sm">
                Tracking #:{" "}
                {order.tracking.tracking_url ? (
                  <a href={order.tracking.tracking_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center space-x-1">
                    <span>{order.tracking.tracking_number}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  order.tracking.tracking_number
                )}
              </p>
            )}
          </div>
        )}
        {Object.keys(order).length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No order details available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
