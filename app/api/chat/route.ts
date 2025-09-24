import { type NextRequest, NextResponse } from "next/server"
import { validateRequest } from "@/lib/chat-validation"
import { forwardToWebhook } from "@/lib/webhook-forwarder"
import { parseResponse } from "@/lib/response-parser"

export async function POST(request: NextRequest) {
  const validationResult = await validateRequest(request)
  if (validationResult instanceof NextResponse) {
    return validationResult
  }
  const { validBody } = validationResult

  const forwardResult = await forwardToWebhook(validBody, request)
  if (forwardResult instanceof NextResponse) {
    return forwardResult
  }
  const { responseText } = forwardResult

  const parsedData = await parseResponse(responseText)
  if (parsedData instanceof NextResponse) {
    return parsedData
  }

  return NextResponse.json(parsedData)
}