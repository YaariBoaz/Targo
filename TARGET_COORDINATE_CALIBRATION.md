# Target Coordinate Calibration Guide

## Overview
This guide helps you calibrate the coordinate mapping between your physical BLE target and the target image displayed in the app.

## Current Setup

### Physical Target
- **Dimensions**: 60cm (width) × 90cm (height) - *Adjust if different*
- **Image File**: `assets/targets/Target 6040.png`
- **Image Resolution**: 3150 × 4725 pixels
- **Aspect Ratio**: 2:3 (width:height)

### Display Target
- **CSS Width**: `min(340px, 80vw)`
- **CSS Height**: `calc(min(340px, 80vw) * 1.5)` - Maintains 2:3 aspect ratio
- **Default Size**: 340px × 510px on most devices

## BLE Coordinate System

### What You Need to Know
To properly map shots, you need to understand what coordinate system your BLE device uses:

1. **Coordinate Format**:
   - Normalized (0.0 to 1.0)?
   - Centimeters?
   - Millimeters?
   - Pixels?

2. **Origin Point** (where is 0,0?):
   - Top-left corner?
   - Center of target?
   - Bottom-left corner?

3. **Axis Directions**:
   - X-axis: Left to right (standard) or right to left?
   - Y-axis: Top to bottom (standard) or bottom to top?

## Calibration Methods

The conversion function is in `drill-shooting.page.ts` at line 195: `convertBLECoordinatesToDisplay()`

### Method 1: Normalized Coordinates (0.0 to 1.0)
**When to use**: BLE device sends values between 0.0 and 1.0

```typescript
// Origin at top-left, x increases right, y increases down
let x = bleX * displayWidth;
let y = bleY * displayHeight;
```

**Example**:
- BLE sends (0.5, 0.5) → Center of target
- BLE sends (0.0, 0.0) → Top-left corner
- BLE sends (1.0, 1.0) → Bottom-right corner

### Method 2: Coordinates in Centimeters from Top-Left
**When to use**: BLE device sends cm from top-left corner

```typescript
x = (bleX / PHYSICAL_TARGET_WIDTH_CM) * displayWidth;
y = (bleY / PHYSICAL_TARGET_HEIGHT_CM) * displayHeight;
```

**Example**:
- BLE sends (30, 45) cm → Center of 60×90cm target
- BLE sends (0, 0) cm → Top-left corner
- BLE sends (60, 90) cm → Bottom-right corner

### Method 3: Coordinates in Centimeters from Center
**When to use**: BLE device uses center as origin (0,0)

```typescript
const centerX = displayWidth / 2;
const centerY = displayHeight / 2;
x = centerX + (bleX / (PHYSICAL_TARGET_WIDTH_CM / 2)) * centerX;
y = centerY + (bleY / (PHYSICAL_TARGET_HEIGHT_CM / 2)) * centerY;
```

**Example**:
- BLE sends (0, 0) cm → Center of target
- BLE sends (-30, -45) cm → Top-left corner
- BLE sends (30, 45) cm → Bottom-right corner

### Method 4: Inverted Y-Axis
**When to use**: BLE Y-axis is inverted (0 at bottom)

Add this line after your conversion:
```typescript
y = displayHeight - y;
```

## Calibration Steps

### Step 1: Test Corner Shots
1. Fire shots at each corner of the physical target
2. Check the console logs: `BLE coordinates: (x, y) -> Display: (x, y)`
3. Verify the shots appear in the correct corners on the app

### Step 2: Test Center Shot
1. Fire a shot at the center of the target
2. Verify it appears in the center on the app
3. The center should be at approximately (170px, 255px) on default display

### Step 3: Test Edge Shots
1. Fire shots along the edges (top, bottom, left, right)
2. Verify they align correctly with the target image
3. Pay special attention to the QR code areas

### Step 4: Verify QR Code Shots
1. Fire shots at the QR codes in the corners
2. Confirm they appear on the QR codes in the app image
3. This confirms the full target area is mapped correctly

## Troubleshooting

### Shots Appear in Wrong Quadrant
**Issue**: X or Y axis might be inverted

**Solutions**:
- Try: `x = displayWidth - x;` for X-axis inversion
- Try: `y = displayHeight - y;` for Y-axis inversion

### Shots Appear Stretched or Compressed
**Issue**: Aspect ratio mismatch

**Solutions**:
1. Verify physical target dimensions (update `PHYSICAL_TARGET_WIDTH_CM` and `PHYSICAL_TARGET_HEIGHT_CM`)
2. Ensure CSS maintains correct aspect ratio (currently 2:3)

### Shots Appear Offset but Proportional
**Issue**: Origin point mismatch

**Solutions**:
- If shots appear shifted but maintain shape, the origin is likely wrong
- Try Method 3 (center origin) instead of Method 1 (top-left origin)

### Shots Only Appear in Center Area
**Issue**: Coordinate scale mismatch

**Solutions**:
- BLE might be sending cm but code expects normalized values
- Try Method 2 (cm from top-left) instead of Method 1 (normalized)
- Check if you need to divide or multiply by physical dimensions

## Common BLE Target Systems

### System A: Normalized with Center Origin
```typescript
const centerX = displayWidth / 2;
const centerY = displayHeight / 2;
const x = centerX + bleX * displayWidth;
const y = centerY + bleY * displayHeight;
```

### System B: Millimeters from Top-Left
```typescript
const x = (bleX / 10 / PHYSICAL_TARGET_WIDTH_CM) * displayWidth;
const y = (bleY / 10 / PHYSICAL_TARGET_HEIGHT_CM) * displayHeight;
```

### System C: Normalized with Inverted Y
```typescript
const x = bleX * displayWidth;
const y = (1 - bleY) * displayHeight;
```

## Getting Help

1. **Check Console Logs**: Look for the conversion debug line showing BLE → Display coordinates
2. **Test with Known Positions**: Fire at corners/center and note the BLE values
3. **Document BLE Values**: Record what the BLE device sends for:
   - Top-left corner
   - Top-right corner
   - Bottom-left corner
   - Bottom-right corner
   - Center

Share this information to get accurate calibration assistance.

## Current Implementation

The code currently uses **Method 1** (normalized coordinates from top-left).

To change to a different method:
1. Edit `drill-shooting.page.ts`
2. Find `convertBLECoordinatesToDisplay()` method (line ~195)
3. Comment out current method and uncomment the appropriate option
4. Test with corner/center shots
5. Adjust as needed

## Quick Test Code

Add this to `convertBLECoordinatesToDisplay()` for testing:
```typescript
// Test: Map known BLE values to expected display positions
if (bleX === 0 && bleY === 0) {
  console.log('Top-left corner detected');
} else if (bleX === 1 && bleY === 1) {
  console.log('Bottom-right corner detected');
} else if (Math.abs(bleX - 0.5) < 0.01 && Math.abs(bleY - 0.5) < 0.01) {
  console.log('Center detected');
}
```
