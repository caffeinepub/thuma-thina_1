# Thuma Thina

## Current State
Version 56 is live. Add product works. But special products (isSpecial=true) never persist after page reload. All other entities (towns, retailers, orders) load correctly. Staff suspension and shareable listing links are missing.

## Requested Changes (Diff)

### Add
- Purchase amount input per meter entry in the special product cart
- Shareable listing URL: `/listing/:listingId` route + ListingDetailPage
- "Copy Link" button on catalogue listing cards
- "Suspend" button on approved staff in ApprovalsPage (calls existing setApproval with rejected status)

### Modify
- `declarations/backend.did.js`: both `Product` IDL.Record entries missing `isSpecial: IDL.Bool` and `serviceFee: IDL.Float64` — add them (ROOT FIX for isSpecial not persisting)
- `declarations/backend.did.d.ts`: `Product` type missing `isSpecial: boolean` and `serviceFee: number`
- `data/mockData.ts`: add `purchaseAmount?: number` to MeterEntry in CartItem and OrderItem
- `CartPage.tsx`: add "Purchase amount (R)" number input per meter entry; update order summary to show purchase total + service fee total
- `AppContext.tsx`: extend `updateMeterInput` or add `updateMeterPurchaseAmount` to handle the number field
- `App.tsx`: add `/listing/:listingId` route
- `CataloguePage.tsx`: add "Share" / "Copy Link" button on each listing card
- `ApprovalsPage.tsx`: add "Suspend" button for approved staff (status: active)

### Remove
- Nothing

## Implementation Plan
1. Patch both Product IDL records in `declarations/backend.did.js` to add `'isSpecial': IDL.Bool, 'serviceFee': IDL.Float64`
2. Patch `declarations/backend.did.d.ts` Product interface
3. Add `purchaseAmount?: number` to MeterEntry in mockData.ts
4. Add purchase amount input to CartPage.tsx special cart section
5. Add `updateMeterPurchaseAmount` function to AppContext.tsx
6. Add `/listing/:listingId` route to App.tsx and create ListingDetailPage.tsx
7. Add Copy Link button in CataloguePage.tsx listing cards
8. Add Suspend button in ApprovalsPage.tsx for active staff
