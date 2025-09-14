# Mobile Keyboard Overflow Fix

## Problem
On mobile devices, when users interact with the chat input field, the virtual keyboard appears and takes up approximately 40% of the screen height. This causes the viewport to resize, but the chat widget wasn't properly adapting to these changes. When users send a message or exit the keyboard, the widget's layout becomes broken with the bottom 15% of the content being cut off.

## Solution
We implemented a comprehensive solution to handle viewport changes when the virtual keyboard appears or disappears:

### 1. Custom Hook for Keyboard Detection
Created `useMobileKeyboard` hook that:
- Uses the VisualViewport API for modern browsers
- Falls back to orientation/focus events for older browsers
- Detects when the keyboard is open based on viewport height changes
- Calculates the keyboard height for precise adjustments

### 2. Dynamic Height Adjustment
Modified the chat widget to:
- Dynamically adjust its height based on viewport changes
- Subtract keyboard height when it's open
- Use CSS transitions for smooth animations
- Maintain proper scroll position during keyboard events

### 3. Additional Safety Measures
To ensure content is never cut off:
- Reduced scroll area height on mobile with a safety margin
- Added extra padding at the bottom of the scroll area
- Implemented conservative height calculations
- Added CSS padding to prevent content cutoff

### 4. CSS Improvements
- Added `keyboard-open` class for smooth transitions
- Enhanced mobile-specific styles for better handling
- Improved scroll container behavior on mobile
- Added extra padding to prevent content cutoff

### 5. Performance Optimizations
- Throttled resize events to prevent excessive updates
- Used proper cleanup for event listeners
- Added timeouts for better DOM synchronization

## Technical Details
The solution works by:
1. Monitoring viewport height changes through the VisualViewport API
2. Calculating when the keyboard is likely open by comparing viewport height to screen height
3. Adjusting the chat widget's height dynamically by subtracting the keyboard height
4. Maintaining scroll position to ensure users don't lose their place in the conversation
5. Adding safety margins to prevent content cutoff

## Testing
The solution has been tested on:
- iOS Safari (mobile and tablet)
- Android Chrome
- Desktop browsers (no impact on non-mobile devices)
- Various screen sizes and orientations

## Files Modified
- `components/chatbot-widget.tsx` - Main component updates with safety margins
- `hooks/use-mobile-keyboard.ts` - New custom hook
- `app/globals.css` - CSS improvements with safety padding
- `app/keyboard-test/page.tsx` - Test page for validation