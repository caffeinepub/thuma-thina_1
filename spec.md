# Thuma Thina

## Current State
Fully functional community personal-shopper and delivery platform on ICP. Orders start as `awaiting_payment`, operators mark them paid, shoppers pick them up, drivers deliver. The system has news/blog, Nomayini wallet, staff roles, product catalogue, and reviews.

## Requested Changes (Diff)

### Add
- **Platform-wide Nomayini analytics** on admin analytics page: total tokens distributed today/week/month across all users; total locked in 3-month pool; total locked in 4-year pool; chart of daily distributions
- **Admin data management section** (new tab on admin approvals or separate page): delete individual user accounts; bulk wipe sections (all orders, all Nomayini data, all users)
- **Junior admin roles**: three new scoped roles `products_admin`, `listings_admin`, `approvals_admin` stored on `StaffUser`. Admin can assign these in the Approvals → Admins tab. Junior admins see only their scoped section in the sidebar
- **Reviews on staff profile pages**: shopper, driver, and operator profile pages each show a reviews section with average rating, total reviews, and individual review cards
- **Operator all-orders tracking tab**: third tab "All Orders" on operator dashboard showing every order that passed through their pick-up point (any status), so they can answer customer enquiries
- Backend: `deleteUser`, `getAllNomayiniBalances`, `wipeAllOrders`, `wipeAllNomayini`, `wipeAllUsers` functions

### Modify
- **Order persistence for drivers**: `completedDeliveries` filter in `MyDeliveriesPage` already includes `delivered`/`collected` — but orders vanish because `loadOrdersFromBackend` fetches ALL orders and the driver's completed orders are included. Root cause: `getOrdersByArea` in backend filters to `status == "pending"` only. Fix: load all orders for admins; for staff, load all orders they are associated with regardless of status
- **Order persistence for shoppers**: `completedOrders` filter in `MyShopperOrdersPage` already includes post-delivery statuses — same root cause as above. Fix alongside driver fix
- **Operator dashboard**: orders disappear after `handleMarkPaymentReceived` because the backend `getOrdersByPickupPoint` returns ALL statuses already, but the frontend `incoming` filter only shows `out_for_delivery`, `delivered`, `accepted_by_driver`. Add `pending`, `accepted_by_shopper`, `shopping_in_progress`, `ready_for_collection`, `collected` to the tracking view
- **Category persistence**: `addCategory` in AppContext calls backend but may fail silently; ensure error is surfaced and category is not added locally if backend call fails
- **Nomayini analytics section** in admin analytics: replace current single-wallet stats with platform-wide aggregated stats pulled from all users' balances

### Remove
- Nothing removed

## Implementation Plan

1. **Backend (`main.mo`)**: Add `deleteUser(principal)`, `getAllNomayiniBalances()`, `wipeAllOrders()`, `wipeAllNomayini()`, `wipeAllUsers()` functions. All require admin auth.
2. **IDL (`declarations/backend.did.js`, `backend.did.d.ts`, `backend.ts`)**: Add declarations and wrappers for the 5 new backend functions.
3. **AppContext**: Add `deleteUser`, `getAllNomayiniBalances`, wipe functions to context interface and implementations.
4. **Order loading fix**: Change `loadOrdersFromBackend` so it loads all orders for admin, and for staff loads orders where they are shopper/driver/operator regardless of status (use `getOrders` for admin, keep current area-based approach but remove status filter from backend `getOrdersByArea`).
5. **Backend `getOrdersByArea` fix**: Remove the `status == "pending"` filter so all statuses are returned for the area.
6. **Operator dashboard**: Add "All Orders" tab showing every order at their pick-up point sorted by date.
7. **Admin analytics**: Replace Nomayini section with platform-wide aggregated view: distributed today/week/month, total locked short-term, total locked long-term.
8. **Admin data management**: New "Data Management" tab in ApprovalsPage (or separate page linked from admin nav) with delete user buttons and bulk wipe sections.
9. **Junior admin roles**: Add `juniorAdminRole?: 'products_admin' | 'listings_admin' | 'approvals_admin'` to `StaffUser` type. Admin Admins tab gets role assignment dropdown. App.tsx checks this role for routing/sidebar visibility.
10. **Staff profile review sections**: Wire `ReviewsSection` component into `DriverProfilePage`, `OperatorProfilePage`, and a new `ShopperProfilePage`. Load reviews from AppContext `getReviewsForTarget` using staff member's principal/id.
