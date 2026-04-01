# Thuma Thina

## Current State
Orders go straight to `pending` status on placement, immediately visible to shoppers. Operator dashboard only handles incoming/delivery orders (out_for_delivery, delivered, accepted_by_driver). No payment confirmation step exists.

## Requested Changes (Diff)

### Add
- New `OrderStatus` value: `awaiting_payment` (inserted before `pending` in workflow)
- Operator dashboard: new "Awaiting Payment" tab listing orders at `awaiting_payment` status for their pick-up point, with a "Mark Payment Received" button that transitions to `pending`
- After `placeOrder` backend call, immediately call `actor.updateOrderStatus` on each new sub-order to set status to `awaiting_payment` (since backend defaults to `pending`)

### Modify
- `mockData.ts`: Add `awaiting_payment` to `OrderStatus` union, `ORDER_STATUS_LABELS` (label: "Awaiting Payment"), and beginning of `ORDER_STATUS_STEPS`
- `StatusBadge.tsx`: Add yellow/amber styling for `awaiting_payment` status
- `IncomingOrdersPage.tsx`: Add "Awaiting Payment" tab alongside existing "Incoming Orders" tab; show orders where `o.pickupPointId === myPickupPoint?.id && o.status === 'awaiting_payment'`; each card has a "Mark Payment Received" button calling `updateOrderStatus(orderId, 'pending')`
- `MyOrdersPage.tsx`: Add `awaiting_payment` to the FILTERS list with label "Awaiting Payment"
- `AppContext.tsx`: In `placeOrder`, after `loadOrdersFromBackend()` succeeds, call `actor.updateOrderStatus` for each new sub-order to set status to `awaiting_payment`
- Customer order tracking: `awaiting_payment` status shows message like "Go to [pick-up point name] to pay for your order"

### Remove
- Nothing removed

## Implementation Plan
1. Update `OrderStatus` type + labels + steps in `mockData.ts`
2. Update `StatusBadge.tsx` with amber color for `awaiting_payment`
3. Update `AppContext.tsx` placeOrder to immediately set status to `awaiting_payment` after placing
4. Update `IncomingOrdersPage.tsx` to add Awaiting Payment tab with mark-paid button
5. Update `MyOrdersPage.tsx` to include awaiting_payment in filters
6. Update `MyOrdersPage.tsx` order tracking to show pick-up point message for awaiting_payment orders
