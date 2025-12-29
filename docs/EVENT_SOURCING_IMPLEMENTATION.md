# Event-Sourced Pixel Storage Implementation Summary

## Completed Implementation

This document summarizes the completed migration from direct state storage to event-sourced pixel storage using modification batches.

## Changes Made

### 1. Type Definitions (`src/types/models.ts`)
- ✅ Added `ModificationBatch` interface for 8-hour batched modifications
- ✅ Added `PixelModification` interface for individual pixel changes
- ✅ Updated `Pixel` to include optional `modificationBatchId` reference
- ✅ Updated `PixelRow` to include optional `lastSnapshotAt` for cache tracking
- ✅ Kept `Change` and `PixelChange` interfaces for backward compatibility

### 2. New Modification Service (`src/services/modification.service.ts`)
- ✅ `getBatchId()` - Generate batch ID based on user and time window
- ✅ `getBatchStartTime()` - Calculate 8-hour window start
- ✅ `getBatchEndTime()` - Calculate 8-hour window end
- ✅ `getCurrentBatch()` - Get or create user's current batch
- ✅ `appendToModificationBatch()` - Append pixels to current batch
- ✅ `getBoardModifications()` - Query all modifications for a board
- ✅ `getModificationsSince()` - Get modifications after timestamp
- ✅ `getUserModifications()` - Get user's modification batches
- ✅ `replayModifications()` - Rebuild board state from event history
- ✅ `getModificationCount()` - Count pixels in a batch
- ✅ `getPixelHistoryAtCoordinate()` - Get complete history at coordinate

### 3. Updated Pixel Service (`src/services/pixel.service.ts`)
- ✅ Refactored `placePixel()` to use modification batches
- ✅ Refactored `placeMultiplePixels()` to batch modifications
- ✅ Both functions now record in event source and update snapshot cache
- ✅ Removed dependency on old `change.service`

### 4. Updated Board Service (`src/services/board.service.ts`)
- ✅ Added import for `replayModifications`
- ✅ Updated `updatePixelRow()` to include `lastSnapshotAt` timestamp
- ✅ Added `isSnapshotStale()` - Check if snapshot needs refresh (4-hour threshold)
- ✅ Added `getPixelRowFromModifications()` - Derive row from event source
- ✅ Added `rebuildBoardSnapshot()` - Regenerate full board cache
- ✅ Added `getBoardPixelsWithRefresh()` - Auto-refresh stale snapshots

### 5. New Components
- ✅ Created `ModificationEntry.tsx` - Display single modification batch
- ✅ Created `ModificationHistory.tsx` - Full history sidebar
- ✅ Created `ModificationHistoryToggle.tsx` - Toggle button for history

### 6. New Hook
- ✅ Created `useBoardModifications.ts` - Real-time subscription to modifications

### 7. Updated Pages
- ✅ Updated `BoardPage.tsx` to use new modification components and hooks

### 8. Firestore Configuration
- ✅ Updated `firestore.rules` with modifications collection rules
  - Read access for all (transparency)
  - Write access only for authenticated users
  - Users can only update their own batches
  - Immutable event log (no deletions)
- ✅ Updated `firestore.indexes.json` with required composite indexes
  - `modifications` by `boardId` + `batchStartTime`
  - `modifications` by `userId` + `batchStartTime`

### 9. Cleanup
- ✅ Deleted `src/services/change.service.ts`
- ✅ Deleted `src/components/ChangeEntry.tsx`
- ✅ Deleted `src/components/ChangeHistory.tsx`
- ✅ Deleted `src/components/ChangeHistoryToggle.tsx`
- ✅ Deleted `src/hooks/useBoardChanges.ts`

## Architecture Overview

### Event Sourcing Pattern
- **Modifications Collection**: Source of truth (immutable event log)
- **Pixels Collection**: Snapshot cache (derived state for performance)
- **8-Hour Batching**: Natural grouping aligned with merge window

### Data Flow
```
User Places Pixel
    ↓
Append to Modification Batch (Event Source)
    ↓
Update Pixel Snapshot (Cache)
    ↓
Display to User
```

### Snapshot Refresh Strategy
- Snapshots track `lastSnapshotAt` timestamp
- Auto-refresh if snapshot is older than 4 hours
- Can force refresh with `getBoardPixelsWithRefresh(boardId, true)`
- Snapshots rebuilt by replaying all modifications

## Key Benefits

1. **Complete History**: Every pixel placement preserved at every coordinate
2. **Stacking Support**: Multiple pixels can be placed at same coordinate
3. **Time Travel**: Can replay board state at any point in history
4. **Transparency**: Full audit log of all modifications
5. **Performance**: Snapshot cache for fast rendering
6. **Efficient Batching**: Reduced writes with 8-hour windows

## Firestore Structure

```
boards/{boardId}/
├── modifications/{userId_timestamp}
│   ├── id: string
│   ├── boardId: string
│   ├── userId: string
│   ├── username: string
│   ├── batchStartTime: Timestamp
│   ├── batchEndTime: Timestamp
│   ├── pixels: PixelModification[]
│   ├── pixelCount: number
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
│
Board document fields:
  ├── snapshot: { '0': '#FF0000', '150': '#00FF00', ... }  ← Sparse color map (only non-null pixels)
  └── lastSnapshotAt: Timestamp                            ← Last snapshot update
```

## Migration Notes

- Old `changes` collection is kept for backward compatibility
- No automatic data migration - new system starts fresh
- Previous pixel placements won't show in modification history
- Firestore rules support both old and new systems during transition

## Next Steps (Optional)

1. Add UI to view pixel history at specific coordinates
2. Implement time-travel feature to view board at past timestamps
3. Add heatmap visualization of modification density
4. Create admin tools to rebuild snapshots on demand
5. Optimize snapshot refresh based on modification frequency
6. Consider periodic full snapshots for faster recovery

## Testing Checklist

- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Test pixel placement creates modification batch
- [ ] Test modifications group correctly in 8-hour windows
- [ ] Test modification history displays correctly
- [ ] Test snapshot auto-refresh after 4 hours
- [ ] Test pixel stacking at same coordinates
- [ ] Test replay modifications function
- [ ] Test real-time modification updates

## Performance Considerations

- **Document Size**: Monitor modification batch sizes (1MB Firestore limit)
- **Query Limits**: Default 50 batches, adjust based on needs
- **Snapshot Frequency**: 4-hour threshold balances freshness and cost
- **Index Requirements**: Composite indexes required for queries (configured)

---

Implementation completed successfully. All todos completed, no linting errors.



