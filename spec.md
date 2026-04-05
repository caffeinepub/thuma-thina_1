# Thuma Thina - Build 1: Catalogue & Admin UX

## Current State

- Products, Retailers, Listings, Exclusive Products (RetailerProducts), Pick-up Points all exist in backend
- `addProduct`/`updateProduct` take 8 params including `isSpecial` and `serviceFee`
- `isSpecial`/`serviceFee` ARE in the IDL `Product` record and `backend.did.d.ts` Product type
- BUT `backend.ts` `Product` interface is MISSING `isSpecial` and `serviceFee` fields -- they are silently dropped by `from_candid_vec_n28` conversion
- Retailers are already grouped by town in LocationsPage retailers tab
- Exclusive product (RetailerProduct) category dropdown in LocationsPage uses hardcoded 6-category array, NOT shared backend categories
- CataloguePage shows exclusive product area name but NOT town name on tile
- No size/color attribute system exists
- No under-18 warning on beverages
- No `exportRetailer` function in backend or frontend
- `updateRetailerProduct` takes 7 params (id, name, desc, cat, price, emoji, imagesJson) -- matches backend and all IDL files
- `updateProduct`, `updateListingPrice`, `updatePickupPoint` are all in the idlFactory and working

## Requested Changes (Diff)

### Add
- `exportRetailer` backend function: takes sourceRetailerId, new retailer name, targetTownId, targetBusinessAreaId, targetAddress -- creates a new independent Retailer record linked to target town/area, but whose exclusive products share the same RetailerProduct records as the source (via a `parentRetailerId` field on the new retailer). New backend function `exportRetailerToTown`.
- `parentRetailerId` optional field on `Retailer` type in backend -- exported retailers store the source retailer ID so exclusive products can be resolved from the parent
- Export Retailer UI in LocationsPage: button on each retailer card to export to another town; dialog to select target town, business area, and optionally override name/address
- Category-specific product attributes: `availableSizes` and `availableColors` optional fields on `RetailerProduct` type. Auto-detect which categories need these (footwear, clothing, apparel, shoes, jeans, t-shirt, shirts, dresses). When admin adds/edits exclusive product in a size/color category, show size and color input fields. Customer must select size/color before adding to cart.
- Under-18 warning badge: auto-detect beverage/alcohol/liquor/beer/wine/spirits categories; show warning label on product tile in catalogue and on listing detail page
- `exportRetailerToTown` to IDL files (backend.did.js idlFactory, backend.did.d.ts, backend.ts)
- `availableSizes`/`availableColors` fields to `RetailerProduct` in IDL and backend.ts

### Modify
- `backend.ts` `Product` interface: add `isSpecial: boolean` and `serviceFee: number` fields (currently missing, causing silent drop)
- `backend.ts` `from_candid_record_n30` (or equivalent): include `isSpecial` and `serviceFee` in the conversion output
- LocationsPage exclusive product "Add" and "Edit" dialogs: replace hardcoded 6-category array with shared `customCategories` from `useApp()` context; add size/color fields for relevant categories
- CataloguePage exclusive product tile: show town name alongside area name (e.g. "Osizweni - KwaMashu Mall")
- Rename all "Edit" buttons to "Manage" across LocationsPage (retailers, listings, pick-up points) and ProductsPage
- ProductsPage "Manage" (was Edit) dialog: allow editing the product name field so admin can correct typos; use delete+re-add pattern (delete old ID, create new with same data + corrected name)

### Remove
- Nothing removed

## Implementation Plan

1. **Backend (`main.mo`)**:
   - Add `parentRetailerId: ?Text` optional field to `Retailer` type
   - Add `availableSizes: ?Text` and `availableColors: ?Text` to `RetailerProduct` type
   - Add `exportRetailerToTown` function: takes `newId, sourceRetailerId, name, townId, businessAreaId, address` -- creates new Retailer with `parentRetailerId = ?sourceRetailerId`
   - Update `getRetailerProducts` (or add query logic): when fetching exclusive products for an exported retailer, also return products where `retailerId == parentRetailerId`
   - Add `addRetailerProductWithAttributes` function taking 10 params (adds `availableSizes` and `availableColors`)
   - Update `updateRetailerProduct` to accept `availableSizes` and `availableColors` (2 new optional Text params) -- now 9 params total

2. **IDL files** (`declarations/backend.did.js`, `declarations/backend.did.d.ts`, `backend.ts`):
   - Add `parentRetailerId` to `Retailer` IDL record
   - Add `availableSizes`, `availableColors` to `RetailerProduct` IDL record
   - Add `exportRetailerToTown` function entry
   - Update `updateRetailerProduct` from 7 to 9 params (add 2 optional Text)
   - Fix `backend.ts` `Product` interface to include `isSpecial: boolean` and `serviceFee: number`
   - Fix `backend.ts` product conversion function to pass through `isSpecial` and `serviceFee`

3. **Frontend**:
   - `LocationsPage.tsx`: Replace hardcoded category list in exclusive product dialogs with `customCategories` from context; add size/color input fields for relevant categories; add Export Retailer button + dialog per retailer; rename Edit→Manage everywhere
   - `ProductsPage.tsx`: Rename Edit→Manage; make product name editable in manage dialog (delete+re-add pattern)
   - `CataloguePage.tsx`: Show town name on exclusive product tiles; add under-18 warning badge for beverage/alcohol categories
   - `ListingDetailPage.tsx`: Add under-18 warning for beverage products
   - `CartPage.tsx`/`CataloguePage.tsx`: Require size/color selection before adding exclusive products with those attributes to cart
