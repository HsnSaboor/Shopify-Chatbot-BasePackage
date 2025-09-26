# Task Breakdown: Fix Chatbot Widget Responsiveness and Interaction Blocking

**Feature Branch**: `fix-widget-responsiveness-and-interaction-blocking`  
**Task Version**: 1.0  
**Created**: 2025-09-26  
**Total Estimated Effort**: 4-6 hours  
**Dependencies**: Feature spec, implementation plan, current codebase.  

This document breaks down the implementation into actionable tasks. Each task corresponds to steps in the plan and todo list. Status is tracked as Pending, In Progress, or Completed. Do not start implementation until approved.

## Task 1: Enhance Device Detection and Sizing in React Component
**File**: components/chatbot-widget.tsx  
**Related FRs**: FR-001, FR-004, FR-005  
**Description**: Update mobile detection to be dynamic and adjust widget sizing for open/closed states on desktop/mobile. Add postMessage for embedded resizing.  
**Sub-tasks**:
1. Replace static isMobile with matchMedia listener for real-time updates on resize/orientation.
2. Update chat window className: Use Tailwind max-w-[500px] max-h-[800px] for desktop, w-screen h-dvh for mobile open; w-[70px] h-[70px] for closed toggle.
3. Update inline style for non-embedded: width/height min() with viewport calc for desktop, 100vw/100dvh for mobile.
4. Add useEffect to send 'CHATBOT_RESIZE' postMessage in embedded mode on isOpen/isMobile change.  
**Estimated Time**: 1.5 hours  
**Dependencies**: None  
**Status**: Pending  
**Acceptance**: Widget resizes on window change; console logs postMessage in embedded simulation.

## Task 2: Update Embed Script for Iframe Sizing and Non-Blocking
**File**: public/transparent-chatbot-embed.js  
**Related FRs**: FR-002, FR-003  
**Description**: Modify iframe container and styles to handle resize messages, ensure closed state is non-blocking except for toggle.  
**Sub-tasks**:
1. In message listener for 'CHATBOT_RESIZE', set container/iframe dimensions based on data (70px closed, 500x800 desktop open, 100vw/100dvh mobile open).
2. For closed: pointer-events: none on container, auto on toggle (via CSS selector or JS).
3. For open: pointer-events: none on container, auto on iframe; position full screen on mobile.
4. Add window resize listener to forward parent changes to iframe postMessage.
5. Update initial CSS to fallback if postMessage fails.  
**Estimated Time**: 1.5 hours  
**Dependencies**: Task 1 (for postMessage format)  
**Status**: Pending  
**Acceptance**: Iframe sizes correctly; site interactions work except toggle click in closed state.

## Task 3: Update State Hook if Needed
**File**: hooks/use-chatbot-state.ts  
**Related FRs**: FR-004  
**Description**: Ensure device state (isMobile) is persisted and updated on resizes.  
**Sub-tasks**:
1. Include isMobile in saved state object.
2. Add effect to save state on isMobile change.
3. Load isMobile from state on init if available.  
**Estimated Time**: 0.5 hours  
**Dependencies**: Task 1  
**Status**: Pending  
**Acceptance**: isMobile restores correctly on reload; no loss on resize.

## Task 4: Handle Keyboard and Viewport Adjustments
**Files**: components/chatbot-widget/ChatMessages.tsx, components/chatbot-widget/ChatInput.tsx  
**Related FRs**: FR-005  
**Description**: Verify and adjust height calculations for mobile keyboard and dynamic viewport.  
**Sub-tasks**:
1. In ChatMessages, use dvh for height, subtract keyboardHeight as existing.
2. In ChatInput, ensure input doesn't clip with keyboard open.
3. Test viewport units (dvh/vh fallback).  
**Estimated Time**: 0.5 hours  
**Dependencies**: Task 1  
**Status**: Pending  
**Acceptance**: No clipping on keyboard open; heights adjust dynamically.

## Task 5: Implement Testing
**Files**: Tests in __tests__ or integration with Playwright  
**Description**: Add tests to verify sizing, interactions, and edge cases.  
**Sub-tasks**:
1. Unit tests: Snapshot widget for different isMobile/isOpen states.
2. Integration: Playwright scripts for desktop/mobile open/close, measure dimensions, test site clicks behind toggle.
3. Manual: Emulate devices, test orientation, small screens, custom CSS.  
**Estimated Time**: 1-2 hours  
**Dependencies**: All previous tasks  
**Status**: Pending  
**Acceptance**: All spec scenarios pass; no regressions.

## Overall Workflow
1. Complete tasks in order, committing after each.
2. Run linter/tests after changes.
3. Review with stakeholder before merge.

## Risks
- Browser compatibility for dvh/pointer-events.
- PostMessage security in iframes.

---