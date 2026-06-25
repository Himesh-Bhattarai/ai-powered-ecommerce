# Production Pending Work Audit Report

## 1. Audit Scope

Scanned the current repository working tree for production-readiness gaps across `app/`, `app/api/`, `components/`, `context/`, `lib/`, `models/`, `types/`, `package.json`, `next.config.ts`, `tsconfig.json`, `README.md`, and environment variable usage. The scan covered frontend pages, seller/user flows, cart/checkout/wishlist/product detail flows, AI routes and UI, database schemas, authentication helpers, personalization logic, and build/lint status.

## 2. Executive Summary

- Overall status: `Not production-ready`
- Main reason: Core commerce flows are still disconnected or incomplete, especially checkout/order creation, cart persistence, payment, reviews, seller operations, and production auth/session handling.
- Highest-risk missing area: Checkout/orders/payment because the frontend does not create real orders and the existing order API is currently broken against the actual schemas.
- Estimated completion level: 45%

The repo is suitable as a visual college/demo project with some real API integrations, but it cannot be launched for real buyers and sellers until the P0 blockers are completed.

## 3. Feature Completion Matrix

| Module | Frontend Status | Backend Status | Database Status | Production Status | Notes |
|---|---|---|---|---|---|
| Authentication | Partial | Partial | Partial | P0 pending | Login/signup/me exist, but no logout route, refresh route, password reset, email verification, middleware protection, or role separation. |
| User profile | Partial | Partial | Partial | P1 pending | Account page reads user details but profile edit, saved addresses, and real order history are missing. |
| Seller registration/login | Partial | Partial | Partial | P0 pending | Routes and UI exist, but build currently fails in `SellerSignupWizard.tsx`; seller/customer cookies share `accessToken`. |
| Seller dashboard | Partial | Partial | Partial | P0 pending | Add product calls API, but dashboard metrics, orders, inventory, payments, reports, and account health are hardcoded. |
| Product CRUD | Partial | Partial | Partial | P0 pending | Create exists; update/delete routes have auth/id/schema bugs; seller product list/edit/delete frontend is missing. |
| Product listing/search/filter | Partial | Partial | Partial | P1 pending | Listing works with client-side filters; backend has no pagination, server filtering, search params, or category/price endpoints. |
| Product detail page | Partial | Partial | Partial | P1 pending | Product data is real, but reviews, AI summary, specs, shipping, warranty, and FAQ reliability are incomplete. |
| Cart | Partial | Missing | Missing | P0 pending | Cart is localStorage-only; no cart model or authenticated cart API. |
| Wishlist | Partial | Missing | Missing | P1 pending | Wishlist is localStorage-only; no account sync or backend model/routes. |
| Checkout | Partial | Missing/incomplete | Partial | P0 pending | Checkout form does not call order/payment APIs; it only tracks a purchase event and clears local cart. |
| Orders | Partial | Route incomplete | Schema pending | P0 pending | Existing route references missing imports, wrong token field, wrong product fields, and order schema mismatch. |
| Payment | Partial | Missing | Missing | P0 pending | COD UI exists and card is disabled; no payment intent, verification, webhook, refund, or payment model. |
| Reviews/ratings | Partial | Missing | Schema pending | P1 pending | Review UI is local/hardcoded; no create/get/update/delete review route. |
| AI review summary | Partial | Partial | Partial | P1 pending | AI summary route exists, but no review ingestion flow and product page uses fallback static summary. |
| AI FAQ | Partial | Route incomplete | Schema mismatch | P1 pending | FAQ UI calls `/api/faq`; route/schema mismatch prevents reliable generation/storage. |
| AI search | Partial | Partial | Partial | P1 pending | AI search has fallback local search but no pagination/analytics/rate limiting. |
| AI chatbot | Component disconnected | Route placeholder | Missing | P2 pending | Chatbot UI does not call `/api/ai-chatbot`; route returns placeholder text. |
| AI intent/product suggestion | Partial | Partial | Partial | P2 pending | Personalization routes/models exist; need UI completion, safeguards, and production limits. |
| Admin panel | Missing | Missing | Missing | P0 pending | No admin dashboard/routes for users, sellers, products, orders, moderation, or seller approval. |
| Image upload/media handling | Partial | Missing | Schema pending | P1 pending | Product image is a URL field; no upload API, storage, moderation, or multi-image schema. |
| Notifications/email | Missing | Missing | Missing | P1 pending | No order confirmation, seller notification, password reset, shipping, or support email flow. |
| Security/rate limit | Missing | Missing | Partial | P0 pending | No rate limiting, CSRF protection, route middleware, role authorization, or protected seed route. |
| Error/loading/empty states | Partial | Partial | N/A | P1 pending | Some UI states exist, but order/payment/review/API errors are not handled end to end. |
| Deployment/env configuration | Partial | Partial | N/A | P0 pending | Build fails; README is generic; no `.env.example`; env validation and production setup docs are missing. |

## 4. Pending Backend Routes

### [P0] Build-Blocking TypeScript Error

- Status: `Route/app build blocker`
- File/path: `components/seller/SellerSignupWizard.tsx:564`
- Current behavior: `npm run build` compiles then fails type checking with `This expression is not callable. Type 'never' has no call signatures.`
- Pending work: Fix `useSeller()` typing/context export so `login` is callable from TypeScript, then rerun `npm run build`.
- Why it is required for production: A production deployment cannot pass the build step.
- Suggested implementation order: 1

### [P0] Order Create/Get

- Status: `Route incomplete`
- File/path: `app/api/order/route.js`, `models/Order.js`, `models/Product.js`
- Current behavior: The route references `NextResponse`, `cookies`, `verifyToken`, `connectDB`, `User`, `Product`, and `Order` without imports; checks `decoded._id` while tokens use `decoded.id`; decrements `Product.quantity` but the schema uses `stock`; creates `{ user, product, quantity }` while `Order` requires `orderId`, `products`, totals, `userDetails`, and `vendorDetails`.
- Pending work: Rebuild `POST /api/order` to accept cart items, authenticate with `decoded.id`, validate product stock, atomically decrement `stock`, calculate totals, create schema-valid orders, and rollback stock on failure. Rebuild `GET /api/order` to query the actual buyer relation.
- Why it is required for production: Buyers cannot place or view real orders.
- Suggested implementation order: 2

### [P0] Order Update/Cancel

- Status: `Missing route`
- File/path: `app/api/order/route.js` or new `app/api/order/[id]/route.js`
- Current behavior: No route exists to update order status, cancel orders, add tracking, or separate buyer/seller authorization.
- Pending work: Add `GET /api/order/[id]`, `PATCH /api/order/[id]`, and cancellation logic with role checks and stock restoration rules.
- Why it is required for production: Sellers and buyers need order lifecycle management.
- Suggested implementation order: 3

### [P0] Checkout API Integration

- Status: `Frontend exists, backend pending`
- File/path: `app/checkout/page.tsx`, `app/api/order/route.js`
- Current behavior: Checkout submit only records personalization purchase events, shows a local success message, and clears local cart.
- Pending work: Call `POST /api/order`, handle errors, preserve cart on failure, show created order IDs, and redirect to a real order success page.
- Why it is required for production: Checkout currently does not create purchases.
- Suggested implementation order: 4

### [P0] Payment Create/Verify/Webhook

- Status: `Missing route`
- File/path: No payment API files found
- Current behavior: Card payment is disabled in UI; no payment provider, payment model, payment verification, webhook, refund, or payment status update flow exists.
- Pending work: Add payment model and provider routes such as `POST /api/payment/create`, `POST /api/payment/verify`, and webhook route. Link payment status to orders.
- Why it is required for production: Real paid orders cannot be processed safely.
- Suggested implementation order: 5

### [P0] Auth Logout/Refresh/Role Separation

- Status: `Missing route`
- File/path: `app/api/login/route.js`, `app/api/seller-login/route.js`, `lib/jwt/token.js`
- Current behavior: Login and seller login both set `accessToken` and `refreshToken`; no logout route clears cookies; no refresh endpoint consumes refresh tokens; user and seller sessions are not role-scoped.
- Pending work: Add logout and refresh routes, include role/type in JWT payload, separate buyer/seller cookie names or enforce role claims, and update contexts.
- Why it is required for production: Session collisions and stale tokens can grant or break access unpredictably.
- Suggested implementation order: 6

### [P0] Seller/Product Authorization

- Status: `Route incomplete`
- File/path: `app/api/products/route.js`
- Current behavior: `DELETE` uses `mongoose.Types.ObjectId` without importing `mongoose`; `PATCH` checks `decoded._id` but tokens use `decoded.id`; update response selects non-schema fields `title` and `images`; seller approval/status is not enforced before product creation.
- Pending work: Import/validate dependencies, use `decoded.id`, whitelist updatable product fields, return schema fields, and require approved/verified seller status for listing actions.
- Why it is required for production: Sellers cannot reliably manage products, and unauthorized or pending sellers may publish products.
- Suggested implementation order: 7

### [P1] Product Search/Filter/Pagination

- Status: `Route incomplete`
- File/path: `app/api/products/route.js`, `app/api/ai-search/route.js`
- Current behavior: `GET /api/products` returns all products with no pagination, search, category, stock, price, seller, or sort params.
- Pending work: Add server-side query params, pagination metadata, indexes, and consistent normalized responses.
- Why it is required for production: Full catalog loads will not scale and cannot support real browsing/search UX.
- Suggested implementation order: 8

### [P1] Review CRUD

- Status: `Missing route`
- File/path: `components/products/ReviewUploadForm.tsx`, `models/Review.js`
- Current behavior: Review form only stores local component state. Product page displays hardcoded reviews.
- Pending work: Add `GET/POST/PATCH/DELETE /api/reviews`, authenticate users, verify purchase when required, persist images via media storage, and load reviews on product detail.
- Why it is required for production: Real customer feedback and AI review summaries require persisted reviews.
- Suggested implementation order: 9

### [P1] FAQ Create/Get/Delete

- Status: `Route incomplete`
- File/path: `app/api/faq/route.js`, `app/api/ai-faq/route.js`, `models/Faqs.js`
- Current behavior: `app/api/faq/route.js` uses missing imports for `NextResponse`, `cookies`, `verifyToken`, and `SellerInfo`; uses `decoded._id`; writes data that does not match `models/Faqs.js`; generated FAQ upsert omits required `sellerId`.
- Pending work: Align the FAQ route with `AiFaq` schema, decide whether FAQs are AI-generated, seller-authored, or both, import required helpers, and enforce seller ownership.
- Why it is required for production: FAQ generation/storage will fail or create inconsistent data.
- Suggested implementation order: 10

### [P1] AI Review Summary Persistence

- Status: `Backend exists, frontend pending`
- File/path: `app/api/ai-review/route.js`, `app/products/[id]/page.tsx`, `models/Product.js`, `models/Review.js`
- Current behavior: AI summary route returns a text summary from reviews, but product detail ignores it and uses fallback static content. Product schema has `aiReviewSummary` fields that are not updated.
- Pending work: Generate summary from real reviews, save it to `Product.aiReviewSummary`, refresh after review changes, and render saved summary on product pages.
- Why it is required for production: AI review summary is currently mostly presentational.
- Suggested implementation order: 11

### [P2] AI Chatbot

- Status: `Route incomplete`
- File/path: `app/api/ai-chatbot/route.js`, `components/chat/ChatbotButton.tsx`
- Current behavior: Route returns placeholder reply; UI never calls this route and instead only updates the product grid through `onQuery`.
- Pending work: Connect UI to route, generate real assistant responses, include product suggestions, and log chat signals safely.
- Why it is required for production: The chatbot is not a real AI chat experience.
- Suggested implementation order: 12

### [P0] Admin Routes

- Status: `Missing route`
- File/path: No admin API files found
- Current behavior: No admin role, seller approval, product moderation, user management, order dispute, or review moderation APIs exist.
- Pending work: Add admin model/role and protected admin APIs for seller approval, catalog moderation, orders, users, refunds, and reports.
- Why it is required for production: Marketplace operations cannot be controlled safely.
- Suggested implementation order: 13

### [P1] Upload/Media Routes

- Status: `Missing route`
- File/path: Product/review/seller image fields across `models/Product.js`, `models/Review.js`, `components/seller/SellerDashboard.tsx`, `components/products/ReviewUploadForm.tsx`
- Current behavior: Product images are URL strings; review images are client-side previews only; no file storage or validation exists.
- Pending work: Add upload route, storage provider integration, file validation, allowed formats/sizes, and persistent image URLs.
- Why it is required for production: Sellers and buyers cannot upload real product/review media.
- Suggested implementation order: 14

### [P0] Seed Route Protection

- Status: `Route incomplete`
- File/path: `app/api/seed/route.js`
- Current behavior: Public `POST /api/seed` can upsert demo products and has no auth/secret guard.
- Pending work: Remove from production or protect behind admin/secret/dev-only checks.
- Why it is required for production: Public seed endpoints can corrupt production catalog data.
- Suggested implementation order: 15

## 5. Pending Frontend Pages and Components

### [P0] Checkout Page

- Status: `Component disconnected`
- File/path: `app/checkout/page.tsx`
- Current behavior: Checkout form gathers address/payment fields but does not submit them to an order API. Success state says backend order creation/payment/email can connect later.
- Pending work: Submit order payload to backend, require/handle login, show order confirmation, handle stock errors, and keep cart intact on failure.
- Why it is required for production: Users can complete the UI without placing an order.
- Suggested implementation order: 1

### [P0] Account Orders

- Status: `Component disconnected`
- File/path: `app/account/page.tsx`
- Current behavior: Shows hardcoded `0 active` and text saying orders will appear after checkout is connected.
- Pending work: Fetch real orders from `GET /api/order`, render recent orders, statuses, invoices, returns, and tracking links.
- Why it is required for production: Users need order history and tracking.
- Suggested implementation order: 2

### [P0] Seller Dashboard Operations

- Status: `Component disconnected`
- File/path: `components/seller/SellerDashboard.tsx`
- Current behavior: Metrics, action items, orders, inventory alerts, listing health, account health, payments, and quick actions are hardcoded arrays. Only product creation posts to backend.
- Pending work: Fetch seller products, orders, inventory, payout data, account health, and expose working edit/delete/status controls.
- Why it is required for production: Sellers cannot manage real marketplace operations.
- Suggested implementation order: 3

### [P0] Seller Signup/Login Build Fix

- Status: `Component incomplete`
- File/path: `components/seller/SellerSignupWizard.tsx:564`
- Current behavior: Build fails when calling `setLoggedInSeller`.
- Pending work: Type `SellerContext` correctly and make `login` callable in TypeScript.
- Why it is required for production: Deployment build is blocked.
- Suggested implementation order: 4

### [P1] Product Add/Edit/Delete UI

- Status: `Backend exists, frontend pending`
- File/path: `components/seller/SellerDashboard.tsx`, `app/api/products/route.js`
- Current behavior: Add product UI exists, but newly created products are shown as local `Draft` rows. There is no real product list, edit form, delete action, status management, or image upload.
- Pending work: Add seller product table loaded from backend, edit/delete actions, validation, publish/draft status, and real image handling.
- Why it is required for production: Sellers cannot manage catalog after creation.
- Suggested implementation order: 5

### [P1] Product Reviews UI

- Status: `Component disconnected`
- File/path: `app/products/[id]/page.tsx`, `components/products/ReviewUploadForm.tsx`
- Current behavior: Product page shows hardcoded reviews and rating summary. Review form stores reviews locally only.
- Pending work: Load real reviews, submit reviews to backend, verify purchase, upload images, and update summary.
- Why it is required for production: Ratings and reviews are core buyer trust features.
- Suggested implementation order: 6

### [P1] Product FAQ UI

- Status: `Component incomplete`
- File/path: `components/products/ProductFaq.tsx`
- Current behavior: Calls `/api/faq?productId=...` but shows no loading/error/empty state and labels content as fallback preview.
- Pending work: Handle loading/errors, support regeneration/admin or seller control, and render persisted FAQ data reliably after backend fix.
- Why it is required for production: FAQ UX currently fails silently if AI or DB route fails.
- Suggested implementation order: 7

### [P1] Cart Drawer/Page

- Status: `Component disconnected`
- File/path: `components/cart/CartProvider.tsx`
- Current behavior: Cart is localStorage-only, accepts any quantity increment, and promo code only changes local state text.
- Pending work: Persist logged-in carts through API, validate stock before add/quantity changes, implement coupon validation, and sync guest cart on login.
- Why it is required for production: Cart state can be stale, lost, or invalid.
- Suggested implementation order: 8

### [P1] Wishlist Page

- Status: `Component disconnected`
- File/path: `components/wishlist/WishlistProvider.tsx`, `app/wishlist/page.tsx`
- Current behavior: Wishlist is localStorage-only and page text says account sync is not connected.
- Pending work: Add backend wishlist model/routes and sync logged-in user wishlist across devices.
- Why it is required for production: Saved products should persist to account.
- Suggested implementation order: 9

### [P2] AI Chatbot UI

- Status: `Component disconnected`
- File/path: `components/chat/ChatbotButton.tsx`, `app/api/ai-chatbot/route.js`
- Current behavior: Chatbot displays canned assistant messages and never calls the chatbot API.
- Pending work: Send chat messages to backend, render real assistant replies and product cards, and handle loading/error states.
- Why it is required for production: It is currently a search helper, not a chatbot.
- Suggested implementation order: 10

### [P0] Admin Dashboard

- Status: `Missing page`
- File/path: No admin page found
- Current behavior: No admin UI exists.
- Pending work: Add admin login/role guard, seller approval, product moderation, order monitoring, user management, and reports pages.
- Why it is required for production: Marketplace operators need control and moderation.
- Suggested implementation order: 11

### [P1] Order Success/Failure Pages

- Status: `Missing page`
- File/path: No order success/failure page found
- Current behavior: Checkout uses an inline success panel.
- Pending work: Add `/order-success` or `/orders/[id]` and payment failure/cancel pages.
- Why it is required for production: Buyers need durable confirmation, failure recovery, and links to order details.
- Suggested implementation order: 12

## 6. Pending Database/Schema Work

| Model/Schema | File/path | Current Fields | Pending Fields/Relations | Why Needed |
|---|---|---|---|---|
| User | `models/User.js` | `fullName`, `email`, `password`, `phoneNumber`, `address` | Roles, status, email verification, password reset tokens, multiple addresses, audit timestamps for auth events | Required for secure accounts, admin access, and delivery management. |
| SellerInfo | `models/SellerInfo.js` | Identity, shop, legal, bank, status fields | Document upload references, approval metadata, rejection reason, payout status, seller rating, shipping settings | Required for real seller onboarding, compliance, and operations. |
| Product | `models/Product.js` | Seller, name, description, price, image, category, stock, AI review summary | SKU, status, slug, brand, attributes/specs, warranty, dimensions, shipping data, multi-images, moderation state, indexes | Required for production catalog, SEO, search, and seller inventory management. |
| Cart | Missing | N/A | User/session relation, cart items, quantity, price snapshot, coupon, timestamps | Required for authenticated cart persistence and checkout integrity. |
| Wishlist | Missing | N/A | User relation, product refs, timestamps | Required for saved items across devices. |
| Order | `models/Order.js` | `orderId`, products, totals, payment/status, userDetails, vendorDetails | Buyer `user` ref, seller ref, shipment/tracking events, address snapshot, payment ref, cancellation/refund fields, indexes | Existing route cannot query by user reliably; order lifecycle needs relations. |
| OrderItem | Missing | Embedded products only | Product/seller refs, SKU, fulfillment status, price snapshot, return status | Required for multi-seller orders, partial shipping, returns, and seller dashboards. |
| Payment | Missing | N/A | Provider, transaction id, order ref, amount, currency, status, webhook payload, refund fields | Required for paid orders and reconciliation. |
| Review | `models/Review.js` | `productId`, `userId`, `rating`, `comment`, `image` | ObjectId refs, rating max 5, title, images array, verified purchase, helpful/report counts, moderation status, timestamps | Required for trust, moderation, and AI summaries. |
| AiFaq | `models/Faqs.js` | `productId`, `sellerId`, `source`, `faqs[]` | Route alignment, generation metadata, model/source version, approval status | Current route writes do not match schema; FAQ persistence is unreliable. |
| UserPreference/UserEvent | `models/UserPreference.js`, `models/UserEvent.js` | Session/user events and scores | Retention policy, consent/opt-out, cleanup indexes, rate limits | Required for production privacy and data lifecycle. |
| Admin/Role | Missing | N/A | Admin users, permissions, audit logs | Required for seller approval, moderation, refunds, and support operations. |
| Notification | Missing | N/A | Recipient, channel, template, status, provider response | Required for order confirmations, seller alerts, and account emails. |

## 7. Disconnected or Fake/Demo Logic

| File/path | Type | What is disconnected | Required production work |
|---|---|---|---|
| `app/checkout/page.tsx` | Frontend state only | Checkout submit does not create an order or payment. | Call order/payment APIs and handle real success/failure. |
| `app/account/page.tsx` | Hardcoded dashboard | Orders/returns counts and recent orders are static. | Fetch user order history and return/support data. |
| `components/cart/CartProvider.tsx` | localStorage only | Cart has no backend persistence, no stock validation, and promo code is local-only. | Add cart API/model and coupon validation. |
| `components/wishlist/WishlistProvider.tsx` | localStorage only | Wishlist does not sync to user account. | Add wishlist API/model and login merge. |
| `app/wishlist/page.tsx` | Explicit disconnected copy | Text says saved items stay on device until account sync is connected. | Connect saved products to user account. |
| `components/seller/SellerDashboard.tsx` | Mock operations data | Metrics, orders, inventory alerts, listing health, payments, and account health are hardcoded. | Fetch and mutate real seller data. |
| `components/seller/SellerDashboard.tsx` | Placeholder buttons | Print labels, view all, improve listings, quick actions mostly have no handlers. | Wire actions to real routes/pages. |
| `app/products/[id]/page.tsx` | Hardcoded reviews | Rating summary and review list use static arrays. | Fetch real review data. |
| `app/products/[id]/page.tsx` | Fallback AI summary | Product detail uses `getFallbackAiReviewSummary` instead of persisted/generated summary. | Connect to `Product.aiReviewSummary` or generation route. |
| `components/products/ReviewUploadForm.tsx` | Local-only form | Submitted reviews and images are kept in component state only. | Persist reviews and uploaded media. |
| `components/products/ProductDetailTabs.tsx` | Placeholder specs | Brand, material, and warranty are `Not provided`. | Add schema fields and seller form inputs. |
| `components/products/ProductFaq.tsx` | Partial API call | No loading/error/empty state; backend route currently mismatches schema. | Fix backend and add frontend states. |
| `components/chat/ChatbotButton.tsx` | Canned chat | UI shows canned assistant responses and does not call `/api/ai-chatbot`. | Connect real chatbot endpoint. |
| `app/api/ai-chatbot/route.js` | Placeholder route | Returns static reply: "Frontend chatbot integration is ready." | Implement real AI/product assistant logic. |
| `app/api/seed/route.js` | Demo data route | Public route seeds demo products with no auth guard. | Remove or protect in production. |
| `README.md` | Generic scaffold docs | Still contains create-next-app instructions. | Document real setup, env vars, build/deploy, and feature status. |

## 8. Critical Production Blockers

| Priority | Blocker | Area | File/path | Required Action |
|---|---|---|---|---|
| P0 | Production build fails | Deployment | `components/seller/SellerSignupWizard.tsx:564` | Fix `useSeller` typing/callable login and rerun build. |
| P0 | Checkout does not create orders | Commerce | `app/checkout/page.tsx`, `app/api/order/route.js` | Connect checkout to working order API. |
| P0 | Order API is broken against schemas | Commerce | `app/api/order/route.js`, `models/Order.js`, `models/Product.js` | Rebuild order create/get/update routes and schema relations. |
| P0 | No payment processing | Commerce | Missing payment routes/model | Add provider create/verify/webhook and payment model. |
| P0 | Auth lacks logout/refresh/role separation | Security | `app/api/login/route.js`, `app/api/seller-login/route.js`, `lib/jwt/token.js` | Add logout/refresh, role claims, and separate buyer/seller session handling. |
| P0 | Seller dashboard uses mock data | Seller ops | `components/seller/SellerDashboard.tsx` | Connect orders, inventory, listings, payouts, reports, and actions to backend. |
| P0 | No admin moderation/approval | Marketplace ops | Missing admin files | Add admin role, routes, and dashboard. |
| P0 | Public seed route can modify catalog | Security | `app/api/seed/route.js` | Remove or protect route for production. |
| P1 | Reviews are not persisted | Product trust | `components/products/ReviewUploadForm.tsx`, `models/Review.js` | Add review APIs and schema fixes. |
| P1 | FAQ API/schema mismatch | Product support | `app/api/faq/route.js`, `models/Faqs.js` | Align route writes with schema and auth. |
| P1 | No image upload/storage | Catalog/media | Product/review/seller image fields | Add upload service and persisted media references. |

## 9. Feature-by-Feature Pending Checklist

### Authentication

- [ ] Add `POST /api/logout` to clear buyer and seller cookies.
- [ ] Add refresh-token endpoint using `refreshToken`.
- [ ] Add JWT role/type claims for buyer, seller, and admin.
- [ ] Separate buyer and seller cookie names or enforce role-specific authorization.
- [ ] Add middleware or server guards for protected pages.
- [ ] Add password reset and email verification flows.
- [ ] Add rate limiting to login/signup/seller-login.

### Cart

- [ ] Add Cart model.
- [ ] Add backend route to get user/guest cart.
- [ ] Add backend route to add/update/remove cart items.
- [ ] Connect cart drawer to real API for logged-in users.
- [ ] Merge guest cart into user cart on login.
- [ ] Prevent adding or checking out out-of-stock products.
- [ ] Validate promo codes server-side.

### Checkout

- [ ] Submit checkout form to `POST /api/order`.
- [ ] Include address/contact/payment method in order payload.
- [ ] Handle order API validation errors.
- [ ] Keep cart when order creation fails.
- [ ] Add order success and failure pages.
- [ ] Add payment provider flow for non-COD methods.
- [ ] Send order confirmation notification.

### Orders

- [ ] Fix `Order` model buyer/seller relations.
- [ ] Fix `POST /api/order` schema mismatch.
- [ ] Add `GET /api/order` for buyer order history.
- [ ] Add `GET /api/order/[id]` for order details.
- [ ] Add seller order listing route.
- [ ] Add order status update route.
- [ ] Add cancel/return/refund flow.
- [ ] Connect account page and seller dashboard to real orders.

### Payment

- [ ] Add Payment model.
- [ ] Add payment creation route.
- [ ] Add payment verification route.
- [ ] Add provider webhook route.
- [ ] Update order payment status from verified provider events.
- [ ] Add refund/payment failure handling.

### Seller

- [ ] Fix seller signup build error.
- [ ] Add seller approval/admin workflow.
- [ ] Enforce approved seller status before publishing products.
- [ ] Load seller listings from API.
- [ ] Add product edit/delete/status UI.
- [ ] Connect seller orders table to backend.
- [ ] Connect inventory alerts to real stock data.
- [ ] Connect seller payout/payment panels to real data.

### Products

- [ ] Fix product `PATCH` auth field from `decoded._id` to token-compatible field.
- [ ] Import `mongoose` in product route or remove invalid validation.
- [ ] Return correct schema fields from update/delete responses.
- [ ] Add server-side pagination/search/filter/sort to product list.
- [ ] Add product status/moderation fields.
- [ ] Add SKU/specs/brand/warranty/shipping fields.
- [ ] Add multi-image upload and storage.

### Reviews

- [ ] Add review create/get/update/delete routes.
- [ ] Fix rating max from 6 to 5.
- [ ] Add review timestamps and ObjectId refs.
- [ ] Add verified purchase logic.
- [ ] Persist review images through upload service.
- [ ] Replace hardcoded product reviews with real data.
- [ ] Trigger AI summary regeneration after review changes.

### AI Features

- [ ] Fix `/api/faq` route/schema/import issues.
- [ ] Persist generated AI FAQs with required seller/source fields.
- [ ] Connect product page to persisted AI review summary.
- [ ] Connect chatbot UI to `/api/ai-chatbot`.
- [ ] Add AI rate limits and provider failure handling.
- [ ] Add privacy/consent handling for personalization events.

### Admin

- [ ] Add admin role/model or role field.
- [ ] Add admin login/session guard.
- [ ] Add seller approval/rejection UI.
- [ ] Add product moderation UI.
- [ ] Add order/refund/dispute management UI.
- [ ] Add review/report moderation UI.
- [ ] Add basic audit logs.

### Production Hardening

- [ ] Fix production build.
- [ ] Add `.env.example`.
- [ ] Replace generic README with real setup/deployment instructions.
- [ ] Protect or remove `/api/seed`.
- [ ] Add rate limiting to public APIs.
- [ ] Add CSRF strategy for cookie-authenticated mutations.
- [ ] Add centralized validation for route payloads.
- [ ] Add monitoring/logging policy without sensitive data.

## 10. Recommended Build Order

### Phase 1: Core commerce completion

1. Fix the TypeScript build blocker in `SellerSignupWizard.tsx`.
2. Rebuild order schema and `POST/GET /api/order`.
3. Connect `app/checkout/page.tsx` to real order creation.
4. Add order success/detail pages.
5. Add cart backend persistence and stock validation.
6. Add payment model and payment create/verify/webhook flow.
7. Connect account page to real order history.

### Phase 2: Seller/admin completion

1. Fix product update/delete route bugs.
2. Add seller product listing/edit/delete frontend.
3. Add seller order list and order status update routes.
4. Replace seller dashboard hardcoded metrics/orders/inventory with API data.
5. Add admin role and admin dashboard.
6. Add seller approval workflow and enforce approved seller publishing.

### Phase 3: AI feature completion

1. Fix FAQ route/schema alignment.
2. Persist and render AI FAQ data.
3. Add review APIs and connect product reviews.
4. Persist AI review summaries into `Product.aiReviewSummary`.
5. Connect chatbot UI to a real backend assistant route.
6. Add AI rate limits and fallback behavior.

### Phase 4: Production hardening

1. Add logout/refresh routes and role-safe session handling.
2. Add middleware/server route protection.
3. Add rate limiting and CSRF protection.
4. Add upload/media storage and validation.
5. Protect/remove seed route.
6. Add `.env.example`, deployment docs, and env validation.
7. Add order/payment/review/admin test coverage before launch.

## 11. Final Verdict

- Can this repo be shown as a college project demo now? Yes, as a UI-heavy demo with partial API integrations, as long as it is presented honestly as incomplete.
- Can this repo be used by real users now? No. Checkout, orders, payment, seller operations, admin moderation, and production auth are not ready.
- What must be completed first? Fix the production build, rebuild order creation/history, connect checkout to orders, add payment flow, and secure auth/session handling.
- What is the shortest path to production-ready MVP? Focus only on buyer signup/login, product browsing, cart, checkout with COD/payment status, real order history, seller product/order management, and admin seller/product moderation. Defer AI chatbot, advanced recommendations, promotions, and analytics until the core commerce loop works end to end.
