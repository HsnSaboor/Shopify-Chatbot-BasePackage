<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.0.1
- Modified principles: All 5 refined with project specifics (webhooks, stack, UI, storage, onboarding/responsiveness)
- Added sections: None
- Removed sections: None
- Templates requiring updates: plan-template.md ⚠ pending, spec-template.md ⚠ pending, tasks-template.md ⚠ pending, commands/*.md ⚠ pending
- Runtime guidance: README.md ⚠ pending for responsiveness notes
- Follow-up TODOs: Set RATIFICATION_DATE upon deployment
-->

# Shopify AI Chatbot Widget Constitution

## Core Principles

### I. Responsive UI Design
The chatbot must provide a seamless, non-blocking user experience across devices. Desktop: max 500px width, 800px height for open window; Mobile: full 100dvh/100vw on open, with consistent toggle button. Closed state uses transparent background without blocking Shopify site interactions (clicks, scrolls, hovers, touch). Fix misbehaviors by implementing Tailwind responsive classes (e.g., lg:w-[500px] lg:max-h-[800px], md:w-full md:h-screen) and pointer-events-none on overlay.

### II. Real-time Webhook Integration
User inputs trigger webhook calls to generate AI replies, powered by Next.js API routes. Ensure low-latency, secure handling with validation, error fallbacks, and integration with React components for dynamic responses. Non-negotiable: All replies processed via webhooks without direct client-side AI calls.

### III. Secure Local Storage Management
Store message memories and reactive states in browser localStorage, using hooks like use-chatbot-state.ts for persistence. Implement encryption for sensitive data, expiration policies, size limits, and clear functions. Ensure reactivity with Zustand or similar, syncing across sessions without performance degradation.

### IV. Rich UI Component Rendering
Display product cards and order cards as interactive Shadcn/UI components styled with Tailwind CSS in React/Next.js. Support add-to-cart, variant selection, and order details without disrupting chat flow. Components must be accessible, responsive, and integrated with localStorage for state.

### V. User Onboarding and Accessibility
Onboarding form collects initial user data securely upon first open, guiding setup before chat. Ensure WCAG compliance, touch/keyboard navigation, error handling, and progress indicators. Form integrates with reactive states and localStorage; mandatory for new sessions.

## Technical Stack

Powered by Next.js for SSR/routing/API, React for UI, Shadcn/UI + Tailwind CSS for components/styling. Webhooks handle AI replies; localStorage for persistence; hooks for state/reactivity. Embed via iframe with transparent-chatbot-embed.js for Shopify integration. Deployment: Vercel/Shopify apps.

## Development Workflow

TDD mandatory: Tests for responsiveness (desktop/mobile viewports), webhook responses, component rendering, storage security. Reviews verify no blocking overlays, full adaptability. Use Playwright for e2e across devices. Fixes for current issues (sizing misbehavior, interaction blocking) prioritized; update embed script and test in Shopify context.

## Governance

Constitution supersedes instructions. Amendments: Document impact, user approval, migrate templates/scripts. PR compliance checks; violations block. Use README.md for guidance on responsiveness and embedding.

**Version**: 1.0.1 | **Ratified**: TODO(RATIFICATION_DATE): Initial adoption date unknown, set upon first deployment | **Last Amended**: 2025-09-26