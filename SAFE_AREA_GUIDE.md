# Safe Area Implementation Guide

This guide explains how safe areas are handled in the Targo app to prevent UI elements from being obscured by system elements like notches, home indicators, and status bars on mobile devices.

## Overview

Safe areas ensure your content doesn't overlap with:
- **Top**: Status bar, notches (iPhone X+), Dynamic Island
- **Bottom**: Home indicators (iPhone X+), navigation bars
- **Left/Right**: Rounded corners, sensor housings

## Key Principle ⚠️

**Backgrounds extend INTO safe areas (using fixed positioning), while content padding RESPECTS safe areas.**

This ensures:
- ✅ No black bars at top/bottom
- ✅ Background images/colors fill entire screen
- ✅ Interactive content stays within safe areas

## CSS Variables

The following CSS variables are available globally:

```scss
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left: env(safe-area-inset-left, 0px);
--safe-area-right: env(safe-area-inset-right, 0px);
```

## Usage Methods

### 1. **Recommended: Using calc() with CSS Variables**

This is the preferred method as it **adds** safe area insets to your existing padding:

```scss
.my-container {
  padding-top: calc(var(--spacing-lg) + var(--safe-area-top));
  padding-bottom: calc(var(--spacing-xl) + var(--safe-area-bottom));
  padding-left: calc(var(--spacing-lg) + var(--safe-area-left));
  padding-right: calc(var(--spacing-lg) + var(--safe-area-right));
}
```

### 2. **Using Utility Classes**

For quick implementation, use these utility classes:

```html
<div class="safe-area-top">Content with top safe area</div>
<div class="safe-area-bottom">Content with bottom safe area</div>
<div class="safe-area-all">Content with all safe areas</div>
```

### 3. **Using Mixins (Advanced)**

Available mixins in `theme/mixins.scss`:

```scss
// Adds safe area inset to existing padding
@include safe-area-inset('top', var(--spacing-lg));
@include safe-area-inset('bottom', var(--spacing-xl));

// Note: safe-area-padding() is deprecated as it replaces padding
```

## Common Patterns

### Full-Screen Pages with Background (CORRECT APPROACH)

**IMPORTANT**: Use `position: fixed` for backgrounds to cover entire viewport INCLUDING safe areas:

```scss
// Background - FIXED to cover entire viewport INCLUDING safe areas
.background-image {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: url('/path/to/image.png') center center / cover no-repeat;
  z-index: 1;
}

.background-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7));
  z-index: 2;
}

// Content Container - Padding RESPECTS safe areas
.page-container {
  position: relative;
  z-index: 3;
  min-height: 100vh; // Use 100vh, not 100%!
  padding-top: calc(var(--spacing-lg) + var(--safe-area-top));
  padding-bottom: calc(var(--spacing-xl) + var(--safe-area-bottom));
  padding-left: calc(var(--spacing-lg) + var(--safe-area-left));
  padding-right: calc(var(--spacing-lg) + var(--safe-area-right));
}
```

### Tab Bars

```scss
ion-tab-bar {
  padding-bottom: var(--safe-area-bottom);
  height: calc(56px + var(--safe-area-bottom));
}
```

### Fixed Headers

```scss
.header {
  padding-top: calc(var(--spacing-md) + var(--safe-area-top));
}
```

### Modal/Overlay Content

```scss
.modal-content {
  padding-top: calc(var(--spacing-xl) + var(--safe-area-top));
  padding-bottom: calc(var(--spacing-xl) + var(--safe-area-bottom));
}
```

## Testing Safe Areas

### On Browser (Limited)
Safe areas are `0px` on desktop browsers. Use browser DevTools device emulation with iPhone X+ models.

### On iOS Simulator
```bash
# Run in iOS simulator
npx cap run ios
```

### On Android Emulator
```bash
# Run in Android emulator
npx cap run android
```

### On Physical Device
```bash
# Build and sync
npm run build
npx cap sync
npx cap open ios  # or android
```

## Examples in Targo

See these files for reference implementations:
- **Register Page**: `src/app/features/auth/pages/register/register.page.scss`
- **Login Page**: `src/app/features/auth/pages/login/login.page.scss`
- **Welcome Page**: `src/app/features/auth/pages/welcome/welcome.page.scss`
- **Tabs**: `src/app/tabs/tabs.component.scss`

## Common Mistakes to Avoid

❌ **Don't use absolute positioning for backgrounds** - causes black bars
```scss
// BAD - doesn't extend into safe areas
.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

✅ **Do use fixed positioning with 100vw/100vh**
```scss
// GOOD - extends into safe areas
.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}
```

❌ **Don't use `safe-area-padding()` mixin** - it replaces your padding entirely
```scss
// BAD - replaces all padding
@include safe-area-padding('all');
```

✅ **Do use calc() to add safe area to existing padding**
```scss
// GOOD - adds safe area to your desired padding
padding-bottom: calc(var(--spacing-xl) + var(--safe-area-bottom));
```

❌ **Don't forget scrollable content**
```scss
// BAD - content may be cut off
.scrollable {
  padding-bottom: 0;
}
```

✅ **Do add safe area to scrollable containers**
```scss
// GOOD - ensures bottom content is accessible
.scrollable {
  padding-bottom: calc(var(--spacing-lg) + var(--safe-area-bottom));
}
```

## Capacitor Configuration

Ensure `capacitor.config.ts` has proper viewport settings:

```typescript
{
  ios: {
    contentInset: 'automatic'
  }
}
```

And `index.html` has the viewport meta tag:

```html
<meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

## Troubleshooting

### Safe areas not working?
1. Check `viewport-fit=cover` is in the viewport meta tag
2. Verify Capacitor is properly synced: `npx cap sync`
3. Rebuild the app: `npm run build && npx cap sync`
4. Test on a physical device or simulator (not browser)

### Content still overlapping?
1. Verify you're using `calc()` to **add** safe area, not replace padding
2. Check parent containers don't have `overflow: hidden` cutting off padding
3. Ensure `ion-content` doesn't override your padding

### Different behavior on iOS vs Android?
- iOS has larger safe areas (notches, Dynamic Island)
- Android typically only has bottom safe area for gesture navigation
- Test on both platforms to ensure consistent experience
