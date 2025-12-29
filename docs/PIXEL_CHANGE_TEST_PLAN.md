# Pixel Change & Quota Optimization - Test Plan

## Implementation Summary

### Changes Made

1. **`src/services/pixel.service.ts`** - Updated `placeMultiplePixels()`
   - Now reads current pixel state before applying changes
   - Calculates quota needed based on:
     - Same color = NO quota needed
     - Own pixel (different color) = NO quota needed  
     - Empty or other's pixel (different color) = quota needed
   - Only charges quota for pixels that actually need it

2. **`src/components/PixelBoard.tsx`** - Updated `handlePixelPlace()`
   - Now checks both actual pixel state AND pending pixel state
   - Prevents adding same color to pending repeatedly
   - Removes from pending if color is reverted to original

3. **`src/types/index.ts`** - Export missing types
   - Added `PixelModification` and `ModificationBatch` exports

## Test Scenarios

### Scenario 1: Same Color (No Quota Consumption)
**Setup:**
- Board has a red pixel at (5, 5) placed by User A
- User A has 10 quota

**Steps:**
1. User A selects red color
2. User A clicks on (5, 5)
3. User A clicks "Apply"

**Expected:**
- ✅ Pixel should NOT be added to pending (same color check)
- ✅ Quota should remain 10
- ✅ No modification should be recorded

### Scenario 2: Own Pixel Color Change (No Quota Consumption)
**Setup:**
- Board has a red pixel at (5, 5) placed by User A
- User A has 10 quota

**Steps:**
1. User A selects blue color
2. User A clicks on (5, 5) - should add to pending
3. User A clicks "Apply"

**Expected:**
- ✅ Pixel should be added to pending with blue color
- ✅ After "Apply", quota should remain 10 (own pixel)
- ✅ Modification should be recorded
- ✅ Pixel should change to blue

### Scenario 3: Other's Pixel Change (Quota Consumption)
**Setup:**
- Board has a red pixel at (5, 5) placed by User B
- User A has 10 quota

**Steps:**
1. User A selects blue color
2. User A clicks on (5, 5) - should add to pending
3. User A clicks "Apply"

**Expected:**
- ✅ Pixel should be added to pending with blue color
- ✅ After "Apply", quota should become 9 (other's pixel)
- ✅ Modification should be recorded
- ✅ Pixel should change to blue

### Scenario 4: Empty Pixel Placement (Quota Consumption)
**Setup:**
- Board has empty/null pixel at (5, 5)
- User A has 10 quota

**Steps:**
1. User A selects red color
2. User A clicks on (5, 5) - should add to pending
3. User A clicks "Apply"

**Expected:**
- ✅ Pixel should be added to pending with red color
- ✅ After "Apply", quota should become 9 (new pixel)
- ✅ Modification should be recorded
- ✅ Pixel should change to red

### Scenario 5: Pending State (No Quota Until Apply)
**Setup:**
- Board has empty pixel at (5, 5)
- User A has 10 quota

**Steps:**
1. User A selects red color
2. User A clicks on (5, 5) - adds to pending
3. User A checks quota display
4. User A clicks "Clear" instead of "Apply"

**Expected:**
- ✅ Pixel should be in pending state
- ✅ Quota should still show 10 (not consumed yet)
- ✅ After "Clear", pending should be empty
- ✅ Quota should still be 10
- ✅ No modification recorded

### Scenario 6: Multiple Pixels Mixed
**Setup:**
- Board has:
  - Red pixel at (1, 1) placed by User A
  - Blue pixel at (2, 2) placed by User B
  - Empty at (3, 3)
- User A has 10 quota

**Steps:**
1. User A selects green color
2. User A clicks on (1, 1) - own pixel, different color
3. User A clicks on (2, 2) - other's pixel, different color
4. User A clicks on (3, 3) - empty pixel
5. User A clicks "Apply"

**Expected:**
- ✅ All 3 pixels in pending
- ✅ After "Apply", quota should become 8 (only (2,2) and (3,3) consume quota)
- ✅ All 3 modifications recorded
- ✅ All 3 pixels should be green

### Scenario 7: Pending Pixel Same Color Toggle
**Setup:**
- Board has red pixel at (5, 5)
- User A has 10 quota

**Steps:**
1. User A selects blue color
2. User A clicks on (5, 5) - adds blue to pending
3. User A selects blue again (same color)
4. User A clicks on (5, 5) again

**Expected:**
- ✅ First click: blue in pending
- ✅ Second click: should NOT add again (same as pending)
- ✅ Pending count should remain 1

### Scenario 8: Pending Pixel Revert to Original
**Setup:**
- Board has red pixel at (5, 5)
- User A has 10 quota

**Steps:**
1. User A selects blue color
2. User A clicks on (5, 5) - adds blue to pending
3. User A selects red color (original)
4. User A clicks on (5, 5) again

**Expected:**
- ✅ First click: blue in pending
- ✅ Second click: should remove from pending (back to original)
- ✅ Pending count should become 0

## Manual Testing Checklist

- [ ] Test Scenario 1: Same color placement
- [ ] Test Scenario 2: Own pixel change
- [ ] Test Scenario 3: Other's pixel change
- [ ] Test Scenario 4: Empty pixel placement
- [ ] Test Scenario 5: Pending without apply
- [ ] Test Scenario 6: Multiple mixed pixels
- [ ] Test Scenario 7: Pending same color toggle
- [ ] Test Scenario 8: Pending revert to original

## Automated Testing

Unit tests should be added to:
- `src/services/__tests__/pixel.service.test.ts` - Test quota calculation logic
- Mock Firestore data and verify quota consumption

## Browser Testing

Test on: http://localhost:80/

1. Navigate to a board
2. Sign in with test user
3. Execute all manual test scenarios above
4. Verify quota display updates correctly
5. Verify pending pixel count is accurate
6. Verify modifications are recorded correctly









