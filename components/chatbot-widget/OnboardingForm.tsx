"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { ChatbotStylingProps } from "../chatbot-widget"

interface OnboardingFormProps {
  onSubmit: () => void
  chatbotProps: ChatbotStylingProps
}

export function OnboardingForm({ onSubmit, chatbotProps }: OnboardingFormProps) {
  const accentColor = chatbotProps.sendButton?.backgroundColor || '#3b82f6'
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({})

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {}

    if (!name.trim()) newErrors.name = "Name is required"
    if (!email.trim()) newErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email format"
    if (!phone.trim()) newErrors.phone = "Phone is required"
    else if (!/^\+?[\d\s-()]{10,}$/.test(phone)) newErrors.phone = "Invalid phone number"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const userData = { name: name.trim(), email: email.trim(), phone: phone.trim() }
      const onboardedData = { onboarded: true, user: userData }
      localStorage.setItem("chatbotOnboarded", JSON.stringify(onboardedData))
      onSubmit()
    } catch (error) {
      console.error("Error saving onboarding data:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border-t bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-b-xl" style={{ '--accent': accentColor } as React.CSSProperties}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
          Welcome! Let's get started
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Please provide your details to personalize your experience.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className={cn(
                "h-10 px-3 rounded-lg border-gray-200 focus:border-[var(--accent)] focus:ring-[var(--accent)]/20",
                errors.name && "border-red-500 focus:border-red-500"
              )}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={cn(
                "h-10 px-3 rounded-lg border-gray-200 focus:border-[var(--accent)] focus:ring-[var(--accent)]/20",
                errors.email && "border-red-500 focus:border-red-500"
              )}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className={cn(
                "h-10 px-3 rounded-lg border-gray-200 focus:border-[var(--accent)] focus:ring-[var(--accent)]/20",
                errors.phone && "border-red-500 focus:border-red-500"
              )}
            />
            {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !name || !email || !phone}
            className={cn(
              "w-full h-10 rounded-lg text-white transition-all duration-200 hover:opacity-90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            style={{ backgroundColor: chatbotProps.sendButton.backgroundColor }}
          >
            {isSubmitting ? "Saving..." : "Get Started"}
          </Button>
        </form>
      </div>
    </div>
  )
}