# Thuma Thina

## Current State
- LandingPage.tsx has a home carousel for products but no news/blog section
- Operators apply linked to a business area (same as shoppers/drivers), but the operator workflow (`IncomingOrdersPage.tsx`) uses `staffUser.pickupPointId` to find their pick-up point — this field is never set because the backend `UserProfile` only stores `businessAreaId`
- `ShopperAnalyticsPage.tsx` already wires `ReviewsSection` and `LikeDislikeBar` for the shopper role
- `DriverAnalyticsPage.tsx` and `OperatorAnalyticsPage.tsx` / `OperatorProfilePage.tsx` do not yet show reviews/likes

## Requested Changes (Diff)

### Add
- News/blog carousel on the home page: fetch published articles from the backend (`getArticles()`), shuffle randomly, display in a horizontally scrolling carousel below the product carousel. Each card shows title, category badge, date, and article image if present. Links to `/news/:articleId`. Gracefully hidden when no articles exist.
- Wire reviews and likes into `DriverAnalyticsPage.tsx` and `OperatorAnalyticsPage.tsx` (or `OperatorProfilePage.tsx`) using the existing `ReviewsSection` and `LikeDislikeBar` components — same pattern already used in `ShopperAnalyticsPage.tsx`.

### Modify
- `StaffApplyPage.tsx`: for the **operator** role, replace the business area selector with a pick-up point selector (fetch `getPickupPoints()`). Pass the selected pick-up point ID as the `businessAreaId` argument of `registerUser` (since `UserProfile` only has `businessAreaId` on the backend). Add required validation: operator must select a pick-up point to submit.
- `AppContext.tsx`: in the `StaffUser` mapping (where `allUsers` is mapped), for users with `role === AppUserRole.operator`, set `pickupPointId = u.businessAreaId` in addition to / instead of `businessAreaId`. This ensures `IncomingOrdersPage` can find `myPickupPoint` correctly.

### Remove
- Nothing removed.

## Implementation Plan
1. `StaffApplyPage.tsx` — fetch pick-up points; show pick-up point dropdown for operators; validate operator has selected one; pass value as businessAreaId to registerUser
2. `AppContext.tsx` — in StaffUser mapping, for operator role set pickupPointId from businessAreaId
3. `LandingPage.tsx` — add news carousel section after product carousel; fetch articles with getArticles(); shuffle; render cards; link to article detail
4. `DriverAnalyticsPage.tsx` — add LikeDislikeBar and ReviewsSection with targetId=driver's principal, targetType='driver', completedOrderId from a completed order if available
5. `OperatorAnalyticsPage.tsx` (or `OperatorProfilePage.tsx`) — same pattern for operator role
