# Thuma Thina

## Current State

- The app has a universal product catalogue (Product type) with no retailer or price info attached directly.
- Retailers are managed in Locations > Retailers tab (LocationsPage.tsx). Each Retailer has: id, name, townId, address, businessAreaId. No products or assigned shoppers per retailer.
- Product listings (ProductListing) link a universal product + retailer + price in the admin Products > Listings tab.
- Shoppers see all orders in their business area with no retailer-level filtering.
- The customer catalogue (CataloguePage.tsx) and home page carousel have no retailer filter.
- AppContext holds: products, retailers, listings, staffUsers, orders, businessAreas, etc.
- StaffUser has id, name, role, businessAreaId, status, etc. No `assignedRetailerIds` field.
- mockData.ts has Retailer type with no `ownProducts` or `assignedShopperIds` fields.

## Requested Changes (Diff)

### Add

1. **RetailerProduct type** in mockData.ts -- a product unique to one retailer (id, retailerId, name, description, category, price, images[], inStock). No listing needed -- retailer and price are built in.
2. **RetailerProduct state** in AppContext (`retailerProducts`, `setRetailerProducts`).
3. **Retailer edit/detail page** (new component or expanded dialog): When admin clicks a retailer in the Retailers tab, open an edit sheet/drawer with two new sections:
   - **Retailer Products**: table/list of this retailer's unique products, with Add / Delete actions. Add dialog: name, description, category, price, images (up to 3).
   - **Assigned Shoppers**: list of currently assigned shoppers with a Remove button. An "Assign Shopper" dropdown that shows all approved shoppers (role=shopper, status=approved) not already assigned to this retailer.
4. **`assignedRetailerIds` field on StaffUser** (optional string[]) -- which retailers a shopper is dedicated to.
5. **Retailer filter on customer CataloguePage** -- a filter dropdown/chips above the product grid. Options: "All" + each retailer. When a retailer is selected:
   - Show universal products that have a listing for that retailer.
   - Show retailer-specific products (RetailerProduct) for that retailer.
   - "All" shows everything as before.
6. **RetailerProduct cards in catalogue** -- displayed alongside universal product cards but with a "Retailer exclusive" badge and the price shown directly (no listing dropdown needed since the retailer and price are fixed).
7. **Retailer filter also available for shoppers** in their order/shopping view -- when viewing pending orders, a filter chip lets shoppers quickly see only items from a specific retailer.

### Modify

1. **LocationsPage.tsx Retailers tab** -- each retailer card gets an "Edit / Manage" button (pencil icon or chevron) that opens the new retailer detail sheet.
2. **AppContext** -- add `retailerProducts` state (initial: empty array), `setRetailerProducts`. Pass through context.
3. **mockData.ts** -- add `RetailerProduct` interface and an empty `retailerProducts` seed array. Add `assignedRetailerIds?: string[]` to `StaffUser`.
4. **Retailer interface in mockData.ts** -- no type change needed; management happens through separate state.

### Remove

Nothing removed.

## Implementation Plan

1. **mockData.ts**: Add `RetailerProduct` interface (id, retailerId, name, description, category, price, images?, inStock, imageEmoji). Add `assignedRetailerIds?: string[]` to `StaffUser`. Export empty `retailerProducts: RetailerProduct[]` array.

2. **AppContext.tsx**: Import and add `retailerProducts` state (initialized from mockData seed). Expose `retailerProducts`, `setRetailerProducts` in context value and interface.

3. **LocationsPage.tsx**: 
   - Add "Manage" button to each retailer card in the Retailers tab.
   - Create `RetailerDetailSheet` component (Sheet/Drawer) opened when "Manage" is clicked, receiving the selected retailer.
   - Inside sheet: show retailer name/address header, then two sections:
     - **Retailer Products section**: list of `retailerProducts` filtered by this retailer. Add button opens an inline form (name, description, category, price, images up to 3). Delete button removes.
     - **Assigned Shoppers section**: list of `staffUsers` where `assignedRetailerIds` includes this retailer's id. Assign button opens a dropdown of eligible shoppers. Remove button removes the assignment from `staffUsers`.

4. **CataloguePage.tsx (customer)**:
   - Add a retailer filter bar above the product grid (chips or a Select). Options: "All", then each retailer name.
   - When a retailer is selected, filter to show: universal products with a listing for that retailer + RetailerProducts for that retailer.
   - When "All" is selected, show all universal products + all RetailerProducts (appended at end).
   - RetailerProduct cards show name, image/emoji, category badge, "Retailer exclusive" badge, price, and Add to Cart button (uses `addToCart` or new `addRetailerProductToCart` variant that stores the retailerId and price directly).

5. **CartItem type update**: add `retailerProductId?: string` as an alternative to `listingId` for retailer-exclusive items, so checkout can handle them correctly.

6. **Cart/Checkout**: Ensure retailer products in cart display correctly (name, price from the RetailerProduct record) and contribute to delivery fee area grouping (use their retailer's `businessAreaId`).

7. **Catalogue and home page carousels**: when a RetailerProduct appears in the catalogue it shows price directly instead of a retailer dropdown.
