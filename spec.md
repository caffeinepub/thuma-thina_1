# Thuma Thina

## Current State
Full-stack community personal shopper and delivery platform on ICP. Has admin, shopper, driver, operator, and customer roles. Products catalogue, order splitting by area, special product workflow (prepaid electricity), Nomayini token rewards, cash-at-pickup-point payment flow. Blog/news and reviews features do not yet exist.

## Requested Changes (Diff)

### Add
- **Article/Blog system**: Super admin can publish articles with title, body, images, and a category. Articles are public (visible to all including anonymous users). Admin can add article categories that persist for future use.
- **News page** (`/news`): Public page listing all published articles, filterable by category, accessible from main nav.
- **Article detail page** (`/news/:articleId`): Full article view with images and body.
- **Admin News management** (`/admin/news`): Admin can create, edit/update, and delete articles and article categories.
- **Reviews & Ratings**: Customers can leave a written review + star rating (1–5) on a listing or staff member (shopper, driver, operator) only after a completed/delivered order involving that entity. One review per entity per order.
- **Likes/Dislikes**: Separate from reviews — customers can thumbs up/down a listing or staff member independently. Shows aggregate like/dislike counts.
- **Staff review dashboard**: Each staff member sees their own review feed, average rating, and like/dislike totals in their personal analytics/profile page.

### Modify
- `AppHeader.tsx` — add "News" link to the public nav
- Staff analytics/profile pages — add reviews section showing personal stats and reviews
- `App.tsx` — add routes for `/news`, `/news/:articleId`, `/admin/news`

### Remove
- Nothing removed

## Implementation Plan

### Backend (main.mo)
1. Add `Article` type: `{ id: Text; title: Text; body: Text; categoryId: Text; imagesJson: ?Text; authorPrincipal: Principal; createdAt: Int; published: Bool }`
2. Add `ArticleCategory` type: `{ id: Text; name: Text }`
3. Add stable maps: `articles`, `articleCategories`
4. Add functions: `addArticle`, `updateArticle`, `deleteArticle`, `getArticles` (public query, returns all published; admin gets all), `addArticleCategory`, `getArticleCategories`
5. Add `Review` type: `{ id: Text; targetId: Text; targetType: Text; reviewerId: Principal; rating: Nat; comment: Text; orderId: Text; createdAt: Int }`
6. Add `LikeDislike` type: `{ targetId: Text; targetType: Text; userId: Principal; isLike: Bool }`
7. Add stable maps: `reviews`, `likeDislikes`
8. Add functions: `addReview`, `getReviewsForTarget`, `setLikeDislike`, `getLikesDislikesForTarget`, `getMyReviewForOrder`

### IDL Files
- Add all new functions to `declarations/backend.did.js` idlFactory and idlService
- Add type signatures to `declarations/backend.did.d.ts`
- Add wrapper methods to `backend.ts`

### Frontend
- New page: `NewsPage.tsx` — public article list with category filter tabs
- New page: `ArticleDetailPage.tsx` — full article view
- New admin page: `AdminNewsPage.tsx` — CRUD for articles and article categories
- Reviews component: reusable `ReviewsSection.tsx` — shows star rating form (post-order gate) + review list
- Likes/dislikes component: `LikeDislikeBar.tsx` — thumbs up/down with counts
- Wire into `ListingDetailPage.tsx`, staff profile/analytics pages
- Update `AppHeader.tsx` to include News nav link
- Update `App.tsx` routes
