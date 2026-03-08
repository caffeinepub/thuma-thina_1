# Thuma Thina

## Current State

The app has a full Motoko backend for users, locations (towns, business areas, pick-up points, retailers), products, listings, retailer products, and shopper assignments. Authentication uses Internet Identity.

**Known bug:** `AppContext.tsx` calls `actor.getAllShopperAssignments()` inside the main `Promise.all` for all users (including anonymous visitors and regular customers). This is an admin-only endpoint. When any non-admin loads the app, this call throws an error that causes the entire `Promise.all` to fail — so towns, products, retailers, listings, and everything else never load. This is why customers see "Failed to load data. Please refresh."

Orders are still handled in local React state only (no backend persistence). Orders are lost on page refresh.

## Requested Changes (Diff)

### Add

- **Order types in Motoko backend:** `OrderItem`, `Order` with all fields matching the frontend model (id, customerId, customerName, customerPhone, items as JSON, total, status, deliveryType, pickupPointId, pickupPointName, homeAddress, townId, businessAreaId, deliveryAreas as JSON, shopperId, shopperName, driverId, driverName, createdAt, updatedAt, isWalkIn, parentOrderId, dedicatedRetailerId).
- **Order CRUD endpoints:**
  - `placeOrder(...)` — callable by any authenticated user; creates order with status `#pending`
  - `getOrders()` — admin only; returns all orders
  - `getMyOrders()` — returns orders where customerId matches caller principal
  - `getOrdersByStatus(status)` — for shopper/driver dashboards to query available orders
  - `getOrdersByShopperArea(businessAreaId)` — orders with `pending` status in a given area
  - `getOrderById(id)` — returns a single order; admin or order owner or assigned shopper/driver
  - `updateOrderStatus(id, status, extra JSON)` — update status; authorization per role
  - `deleteOrder(id)` — admin only
- **`backend.d.ts` updated** with all new Order types and endpoints.

### Modify

- **`AppContext.tsx` `loadAllData`:** Move `getAllShopperAssignments()` out of the shared `Promise.all`. Only call it when the caller is an admin (after checking `userRole`). This fixes the data load failure for all non-admin users.
- **`AppContext.tsx` `placeOrder`:** Replace in-memory order creation with a real backend call to `actor.placeOrder(...)`. Serialize items and deliveryAreas as JSON strings.
- **`AppContext.tsx` `updateOrderStatus`:** Replace in-memory mutation with a real backend call to `actor.updateOrderStatus(...)`.
- **`AppContext.tsx` `loadAllData`:** Load orders from backend on login — admin loads all, customer loads own orders, shopper/driver loads relevant orders.
- **Shopper dashboard:** Load available orders from backend (filtered by business area and dedicated retailer logic).
- **Driver dashboard:** Load orders with `ready_for_collection` status from backend.
- **Customer MyOrders page:** Load from backend instead of in-memory state.
- **Admin orders page:** Load from backend.
- **Operator walk-in:** Place order via backend.

### Remove

- In-memory-only order creation logic (replaced by backend calls).
- `getAllShopperAssignments()` from the shared `Promise.all` in `loadAllData`.

## Implementation Plan

1. **Fix `main.mo`:**
   - Add `OrderItem` and `Order` types with all required fields
   - Add `orders` map storage
   - Add `placeOrder`, `getOrders`, `getMyOrders`, `getOrdersByStatus`, `getOrdersByShopperArea`, `getOrderById`, `updateOrderStatus`, `deleteOrder` endpoints
   - Add helper for checking if caller is owner or assigned staff

2. **Fix `AppContext.tsx` data load bug:**
   - Move `getAllShopperAssignments()` to be called only when `userRole === 'admin'`
   - Wrap it in its own try/catch to keep admin data loading resilient

3. **Update `backend.d.ts`:**
   - Add `BackendOrder`, `BackendOrderItem` interfaces
   - Add all new order endpoint signatures

4. **Update `AppContext.tsx` order logic:**
   - `placeOrder` calls `actor.placeOrder(...)` and then refreshes order list
   - `updateOrderStatus` calls `actor.updateOrderStatus(...)`
   - `loadAllData` fetches orders from backend based on role

5. **Update dashboard pages** (shopper, driver, customer, admin, operator) to use backend data via context.
