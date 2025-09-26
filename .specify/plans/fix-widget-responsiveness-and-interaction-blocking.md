# Implementation Plan: Fix Chatbot Widget Responsiveness and Interaction Blocking

**Feature Branch**: `fix-widget-responsiveness-and-interaction-blocking`  
**Plan Version**: 1.0  
**Created**: 2025-09-26  
**Estimated Effort**: 4-6 hours (analysis: 1h, implementation: 3h, testing: 1-2h)  
**Dependencies**: Access to spec file, current codebase, browser dev tools for testing. No new dependencies required.  

## Overview
This plan outlines the steps to implement the feature specification for making the chatbot widget responsive across devices and ensuring the closed state does not block Shopify site interactions. The approach focuses on:
- Enhancing device detection and dynamic sizing in the React component.
- Improving iframe handling in the embed script for non-blocking behavior.
- Ensuring seamless communication between the widget and embed via postMessage for resizing.
- Maintaining existing functionality while adding responsive logic.

Key principles:
- Use existing Tailwind classes and inline styles for sizing.
- Leverage current isMobile state and window resize events.
- Ensure the closed toggle is small and positioned to minimize interference.
- Test on desktop, mobile, and orientation changes.

No new libraries or major refactors; build on existing structure.

## Prerequisites
1. Checkout the feature branch: `git checkout fix-widget-responsiveness-and-interaction-blocking`.
2. Ensure local development server is running (`pnpm dev`).
3. Install Shopify theme if needed for embed testing (use browser dev tools to simulate iframe).
4. Review current code in `components/chatbot-widget.tsx`, `public/transparent-chatbot-embed.js`, and `hooks/use-chatbot-state.ts`.

## Implementation Steps

### Step 1: Enhance Device Detection and Sizing in React Component (components/chatbot-widget.tsx)
- **Goal**: Implement FR-001, FR-004, FR-005 – Auto-detect device, set sizes for open/closed, handle resizes.
- **Sub-steps**:
  1. Update the `isMobile` detection to use a media query listener (window.matchMedia) for real-time changes, in addition to initial innerWidth check.
  2. In the chat window div's className and style:
     - For non-embedded: Use Tailwind responsive classes like `max-w-[500px] md:max-w-[500px]` for desktop, `w-full h-dvh` for mobile open.
     - For closed toggle: Ensure fixed 70px size with `w-[70px] h-[70px] rounded-full`.
     - Add viewport units for mobile: `w-screen h-dvh` when open on mobile.
  3. Add a useEffect to listen for window resize/orientation change, updating isMobile and triggering re-render.
  4. For embedded mode: Send postMessage to parent with resize data (width, height, isOpen) on isOpen/isMobile changes.
- **Estimated Time**: 1.5 hours.
- **Output**: Widget resizes correctly in non-embedded mode; messages prepared for embed.

### Step 2: Update Embed Script for Iframe Sizing and Non-Blocking (public/transparent-chatbot-embed.js)
- **Goal**: Implement FR-002, FR-003 – Consistent toggle, non-blocking closed state.
- **Sub-steps**:
  1. In the message listener for 'CHATBOT_RESIZE':
     - When closed (isOpen: false): Set container/iframe to 70px fixed bottom-right, pointer-events: auto only on toggle area (via CSS or JS targeting).
     - When open: Set to full viewport on mobile (100vw/100dvh, pointer-events: none on container but auto on iframe content), or 500x800px on desktop.
     - Use !important styles to override any conflicting CSS.
  2. Ensure closed state: Container background transparent, iframe overflow hidden, positioned to not cover site (small size minimizes block).
  3. For non-blocking: Set container pointer-events: none when closed, but override to auto for the toggle button via CSS selector (e.g., #toggle-button { pointer-events: auto; }).
  4. Add resize listener in embed to forward parent window resizes to iframe.
  5. Update initial CSS media queries to match new logic (remove if postMessage handles all).
- **Estimated Time**: 1.5 hours.
- **Output**: Embed iframe adapts sizes; closed state allows site interactions except toggle click.

### Step 3: Update State Hook if Needed (hooks/use-chatbot-state.ts)
- **Goal**: Ensure state persists across resizes (FR-004).
- **Sub-steps**:
  1. Add isMobile to saved state if not already, to restore correct sizing on reload.
  2. Trigger state save on resize events if dimensions affect state.
- **Estimated Time**: 0.5 hours (minimal changes).
- **Output**: State consistent with device type.

### Step 4: Handle Keyboard and Viewport Adjustments
- **Goal**: Ensure mobile open state accounts for keyboard (from existing logic).
- **Sub-steps**:
  1. In ChatMessages.tsx and ChatInput.tsx, ensure height calculations use dvh and adjust for keyboardHeight as already implemented.
  2. Test that full viewport doesn't clip on keyboard open.
- **Estimated Time**: 0.5 hours.
- **Output**: Smooth mobile experience.

## Testing Plan
- **Unit Tests**: Add/update tests for sizing logic in widget component (e.g., snapshot tests for different isMobile/isOpen states).
- **Integration Tests**: Use Playwright to simulate desktop/mobile, open/close widget, verify dimensions via getBoundingClientRect, check site interactions (e.g., click behind toggle).
- **Manual Testing**:
  1. Desktop: Open dev tools, resize window <768px to simulate mobile, verify toggle and open sizes.
  2. Mobile: Use device emulation in Chrome, test orientation change, keyboard open.
  3. Embed: Load Shopify page with script, test iframe non-blocking (scroll/click site), toggle click opens without block.
  4. Edge: Very small screens, custom CSS on site.
- **Acceptance Criteria**: Match spec scenarios; no regressions in existing features.
- **Estimated Time**: 1-2 hours.

## Risks and Mitigations
- **Risk**: PostMessage communication fails in some browsers. **Mitigation**: Fallback to CSS media queries; test on Chrome, Safari, Firefox.
- **Risk**: Pointer-events override affects toggle click. **Mitigation**: Use specific selectors; test interactions.
- **Risk**: dvh units not supported in older browsers. **Mitigation**: Fallback to vh; check caniuse.
- **Risk**: Existing state breaks on resize. **Mitigation**: Save/restore isMobile in localStorage.
- **Assumptions**: Current isEmbedded detection works; no major Shopify theme conflicts.

## Next Steps After Plan Approval
1. Implement Step 1-4 sequentially, committing after each.
2. Run tests and fix issues.
3. Merge to main after review.

---