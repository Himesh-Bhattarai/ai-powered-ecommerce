# Endpoint Completion Audit

Last scanned: 2026-06-26

This file lists API endpoints that are missing, empty, build-blocking, or incomplete in the current repo. The scan covered `app/api`, frontend `fetch` usage, models, auth helpers, and the local Next.js 16 route-handler guide at `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.

Next.js route handlers in this repo should stay under `app/api/**/route.js|ts` and export named HTTP methods such as `GET`, `POST`, `PATCH`, and `DELETE`.

## Verification Snapshot

- `npm run lint`: passes with 4 warnings.
- `npm run build`: fails.
- Build-blocking endpoint files:
  - `app/api/refreshToken/route.js`
  - `app/api/forgot-password/send-otp/route.js`
  - `app/api/forgot-password/reset-password/route.js`

## Build-Blocking Endpoints

### P0 - `POST /api/refreshToken`

Current state:
- File: `app/api/refreshToken/route.js`
- Build fails because it imports `@/lib/auth/token`, but the repo has `lib/jwt/token.js` and `lib/jwt/index.js`.
- The route expects `decoded._id`, while current JWT payloads use `id`.
- It is not role-aware, so buyer and seller refresh flows can collide.

Should be:
- Import token helpers from `@/lib/jwt`.
- Verify the `refreshToken` cookie.
- Use a consistent payload shape, preferably `{ id, email, role }`.
- Rotate access and refresh cookies.
- Clear both cookies on invalid refresh token.
- If buyer and seller sessions must coexist, use separate cookie names such as `buyerAccessToken`, `sellerAccessToken`, `buyerRefreshToken`, and `sellerRefreshToken`, or enforce a `role` claim everywhere.

Suggested response:

```json
{
  "message": "Token rotated successfully",
  "user": {
    "id": "user-id",
    "email": "buyer@example.com",
    "role": "buyer"
  }
}
```

### P0 - `POST /api/forgot-password/send-otp`

Current state:
- File: `app/api/forgot-password/send-otp/route.js`
- Build fails because it imports `@/lib/otp` and `@/lib/nodeMailer`, but the repo only has `lib/otp/otpGenerator.js` and `lib/nodeMailer/emailService.js`.
- It uses `NextResponse`, `connectDB`, and `User` without imports.
- `lib/otp/otpGenerator.js` calls an undefined `sendEmail`.
- The generated OTP is stored in memory, while reset routes expect hashed OTP fields on the user document.

Should be:
- Import `NextResponse`, `connectDB`, `User`, `generateOTP`, and `sendOtpEmail` from the actual files, or add barrel `index.js` files intentionally.
- Normalize the email.
- Find the user.
- Generate a 6 digit OTP.
- Hash the OTP with the existing `lib/auth/password.js` helper or another installed hashing helper.
- Store `passwordResetOtpHash` and `passwordResetOtpExpires` on the user document.
- Send the raw OTP by email.
- Return a generic success response to avoid account enumeration.

Suggested request:

```json
{
  "email": "buyer@example.com"
}
```

Suggested response:

```json
{
  "message": "If an account exists, a reset code has been sent."
}
```

### P0 - `POST /api/forgot-password/reset-password`

Current state:
- File: `app/api/forgot-password/reset-password/route.js`
- Build fails because `bcryptjs` is imported but not installed.
- The route expects `hashOtp` and `hashOtpExpires`, but those fields do not exist in `models/User.js`.
- It hashes the new password with bcrypt, while normal signup/login uses the repo's scrypt helper in `lib/auth/password.js`.

Should be:
- Use the same password hashing helper as signup/login: `hashPassword` and `verifyPassword` from `@/lib/auth/password`.
- Add reset OTP fields to `models/User.js`, or use a dedicated password reset token model.
- Verify OTP expiry and hash match.
- Save the new password using the same scrypt format.
- Clear reset OTP fields after success.

Suggested request:

```json
{
  "email": "buyer@example.com",
  "otp": "123456",
  "newPassword": "new-secure-password"
}
```

Suggested response:

```json
{
  "message": "Password reset successfully"
}
```

## Existing But Broken Or Incomplete Endpoints

### P0 - `POST /api/logout`

Current state:
- File: `app/api/logout/route.js`
- Uses `cookies`, `NextResponse`, `verifyToken`, `connectDB`, and `User` without imports.
- Reads `accessTOken` instead of `accessToken`.
- Expects `decoded._id`, while current tokens use `id`.
- Logout should not require a valid access token just to clear cookies.

Should be:
- Always delete access and refresh cookies.
- Use `NextResponse.json()` and `response.cookies.delete()`.
- Optionally verify token only if the response needs user data.
- Support buyer and seller cookie names consistently.

Suggested response:

```json
{
  "message": "Logged out successfully"
}
```

### P0 - `POST /api/password-reset`

Current state:
- File: `app/api/password-reset/route.js`
- Uses many globals without imports: `cookies`, `verifyToken`, `NextResponse`, `User`, and `bcrypt`.
- Uses `decoded._id` instead of `decoded.id`.
- The password comparison logic is inverted: it returns `newPassword` when old and new passwords are different.
- The unauthenticated branch finds a user, then does not return a final response.
- This overlaps with `/api/forgot-password/send-otp` and `/api/forgot-password/reset-password`.

Should be:
- Remove this route if the `/api/forgot-password/*` pair is the canonical flow.
- Or redefine it as an authenticated password change endpoint:
  - Verify access token.
  - Accept `{ previousPassword, newPassword }`.
  - Verify previous password with `verifyPassword`.
  - Save new password with `hashPassword`.
  - Return success.

Suggested canonical route:

```txt
PATCH /api/me/password
```

Suggested request:

```json
{
  "previousPassword": "old-password",
  "newPassword": "new-secure-password"
}
```

### P0 - `POST /api/order`

Current state:
- File: `app/api/order/route.js`
- Uses `NextResponse`, `cookies`, `verifyToken`, `connectDB`, `User`, `Product`, and `Order` without imports.
- Expects `decoded._id`; current tokens use `id`.
- Updates `Product.quantity`, but `models/Product.js` uses `stock`.
- Selects product fields `quantity` and `title`, but the schema uses `stock` and `name`.
- Creates `{ user, product, quantity }`, but `models/Order.js` requires `orderId`, `products`, totals, `userDetails`, and `vendorDetails`.
- `models/Order.js` defines `orderSchema` but does not export an `Order` model.
- Checkout does not call this endpoint.

Should be:
- Export a real `Order` model from `models/Order.js`.
- Accept a cart payload, not just one product.
- Authenticate a buyer with `decoded.id`.
- Validate product IDs and requested quantities.
- Atomically decrement `Product.stock`.
- Calculate subtotal, tax, shipping, discounts, and total.
- Create schema-valid order documents.
- For multi-seller carts, either create one order per seller or change the schema so each line item stores seller/vendor details.
- Roll back stock changes if order creation fails.
- Connect `app/checkout/page.tsx` to this endpoint before clearing the cart.

Suggested request:

```json
{
  "items": [
    {
      "productId": "product-id",
      "quantity": 2
    }
  ],
  "userDetails": {
    "fullName": "Buyer Name",
    "phoneNumber": "9800000000",
    "email": "buyer@example.com",
    "address": "Street, City, Region"
  },
  "paymentMethod": "cash",
  "deliveryMethod": "standard"
}
```

Suggested response:

```json
{
  "message": "Order placed successfully",
  "orders": [
    {
      "id": "mongo-id",
      "orderId": "BZ-20260626-0001",
      "status": "pending",
      "paymentStatus": "unpaid",
      "totalAmount": 123.45
    }
  ]
}
```

### P0 - `GET /api/order`

Current state:
- File: `app/api/order/route.js`
- Has the same missing imports and `decoded._id` problem as `POST /api/order`.
- Queries `Order.find({ userId: user._id })`, but the current order schema has no `userId` field.
- Normalizes `order.user`, `order.product`, and `order.quantity`, but the schema has `products` and no `user` or `product` fields.

Should be:
- Query by an explicit buyer reference. Add `buyerId` to `models/Order.js`, or embed buyer id in `userDetails`.
- Return paginated order history for the authenticated buyer.
- Include order status, payment status, totals, created date, product summaries, and tracking fields.

Suggested query params:

```txt
GET /api/order?page=1&limit=10&status=pending
```

Suggested response:

```json
{
  "orders": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pages": 0
  }
}
```

### P0 - `PATCH /api/products` and `DELETE /api/products`

Current state:
- File: `app/api/products/route.js`
- `DELETE` calls `mongoose.Types.ObjectId` without importing `mongoose`.
- `PATCH` expects `decoded._id`, while tokens use `id`.
- `PATCH` accepts the full request body directly, so a seller can attempt to mutate non-allowed fields.
- Both update/delete responses select or return non-schema fields such as `title` and `images`.
- Product creation does not enforce seller `status` or `verificationStatus`.

Should be:
- Prefer REST-style item routes:
  - `PATCH /api/products/[id]`
  - `DELETE /api/products/[id]`
- If keeping query params, import `mongoose` and validate `productId`.
- Use `decoded.id`.
- Verify seller ownership.
- Require approved or verified sellers before create/update.
- Whitelist fields: `name`, `description`, `price`, `image`, `category`, `stock`.
- Return schema fields: `id`, `name`, `description`, `price`, `image`, `category`, `stock`, `seller`.

Suggested request:

```json
{
  "name": "Updated product",
  "description": "Updated description",
  "price": 99.99,
  "image": "https://example.com/image.jpg",
  "category": "Electronics",
  "stock": 20
}
```

### P1 - `GET /api/products`

Current state:
- File: `app/api/products/route.js`
- Returns every product with no server-side pagination, filtering, search, or sort.

Should be:
- Accept query params for catalog browsing.
- Return pagination metadata.
- Keep response shape consistent with `/api/products/[id]`.

Suggested query params:

```txt
GET /api/products?page=1&limit=24&q=headphones&category=Electronics&minPrice=50&maxPrice=500&inStock=true&sort=price_asc
```

Suggested response:

```json
{
  "products": [],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 0,
    "pages": 0
  },
  "filters": {
    "category": "Electronics",
    "q": "headphones"
  }
}
```

### P1 - `GET /api/faq`, `POST /api/faq`, `DELETE /api/faq`

Current state:
- File: `app/api/faq/route.js`
- `POST` and `DELETE` use `NextResponse`, `cookies`, `verifyToken`, and `SellerInfo` without imports.
- `POST` and `DELETE` expect `decoded._id`; current tokens use `id`.
- `GET` upserts `{ productId, faqs }`, but `models/Faqs.js` requires `sellerId` and `source`.
- `POST` tries to create top-level `question`, `answer`, and `createdBy`, but the schema expects a `faqs` array and `sellerId`.
- `DELETE` deletes by `sellerId`, but `GET` never stores `sellerId`.

Should be:
- Align all writes with `models/Faqs.js`.
- `GET /api/faq?productId=` should return a FAQ document. If it auto-generates, it must set `sellerId` from `product.seller` and `source: "ai"`.
- `POST /api/faq` should let the owning seller replace or append `faqs`.
- `DELETE /api/faq?productId=` should delete only when the authenticated seller owns the product.

Suggested seller-authored request:

```json
{
  "productId": "product-id",
  "faqs": [
    {
      "question": "Does it include warranty?",
      "answer": "Yes, seller warranty details should be shown here."
    }
  ],
  "source": "seller"
}
```

Suggested stored document:

```json
{
  "productId": "product-id",
  "sellerId": "seller-id",
  "source": "seller",
  "faqs": []
}
```

### P1 - `POST /api/email-verification`

Current state:
- File: `app/api/email-verification/route.js`
- Verifies `emailVerifyOtp`, `emailVerifyOtpExpires`, and `emailVerified`, but `models/User.js` does not define these fields.
- There is no matching endpoint that sends an email verification OTP during signup.

Should be:
- Add fields to `models/User.js` or create a verification token model.
- Add a send route such as `POST /api/email-verification/send`.
- Signup should trigger verification OTP email or return a state that asks the frontend to request one.
- Verification should compare a hashed OTP, mark `emailVerified: true`, and clear OTP fields.

Suggested send request:

```json
{
  "email": "buyer@example.com"
}
```

Suggested verify request:

```json
{
  "email": "buyer@example.com",
  "otp": "123456"
}
```

### P2 - `POST /api/ai-chatbot`

Current state:
- File: `app/api/ai-chatbot/route.js`
- Returns static placeholder text.
- `components/chat/ChatbotButton.tsx` does not call this endpoint. It only appends canned messages and calls `onQuery`.

Should be:
- Accept a user message and optional conversation history.
- Use `createAiClient()` and a catalog/product context.
- Return a real assistant reply plus optional product suggestions.
- Track `ai_chat_request` through personalization.
- Rate-limit or add basic abuse protection before production.

Suggested request:

```json
{
  "message": "Find me a gift for a gamer",
  "history": []
}
```

Suggested response:

```json
{
  "reply": "Here are a few gaming gift directions...",
  "suggestions": [
    {
      "productId": "product-id",
      "name": "Product name",
      "reason": "Why it matches"
    }
  ]
}
```

### P1 - `POST /api/ai-review`

Current state:
- File: `app/api/ai-review/route.js`
- Generates a plain text summary from `Review` documents.
- There is no review CRUD endpoint feeding real reviews.
- Product detail uses a local fallback summary instead of this endpoint.
- `models/Product.js` already has an `aiReviewSummary` field, but this route does not update it.

Should be:
- Generate a structured summary from persisted reviews.
- Store the result in `Product.aiReviewSummary`.
- Regenerate after review create/update/delete or expose a seller/admin refresh route.
- Product detail should read the saved summary.

Suggested response:

```json
{
  "productId": "product-id",
  "aiReviewSummary": {
    "headline": "Buyers like the value",
    "overview": "Short objective summary",
    "pros": [],
    "cons": [],
    "sentiment": "positive",
    "aiRating": 4.5,
    "averageRating": 4.4,
    "reviewCount": 20,
    "generatedAt": "2026-06-26T00:00:00.000Z"
  }
}
```

### P0 - `POST /api/seed`

Current state:
- File: `app/api/seed/route.js`
- Public `POST` can upsert demo catalog data.
- No secret, admin check, or development-only guard.

Should be:
- Remove from production, or require one of:
  - `NODE_ENV !== "production"`
  - an admin session
  - a server-side seed secret header
- Return `404` or `403` when disabled.

Suggested guard:

```txt
x-seed-secret: server-configured-secret
```

## Missing Or Empty Endpoints

### P0 - Cart API

Current state:
- File exists but is empty: `app/api/cart/route.js`.
- Cart state is localStorage-only in `components/cart/CartProvider.tsx`.
- Quantities are not validated against product stock.

Should be:
- Add a cart model or store cart on the user.
- Support authenticated carts and guest cart merge on login.
- Validate product existence and stock on add/update.

Suggested routes:

```txt
GET /api/cart
PUT /api/cart/items
PATCH /api/cart/items/[productId]
DELETE /api/cart/items/[productId]
DELETE /api/cart
```

Suggested item payload:

```json
{
  "productId": "product-id",
  "quantity": 2
}
```

### P1 - Wishlist API

Current state:
- No `app/api/wishlist` route exists.
- Wishlist state is localStorage-only in `components/wishlist/WishlistProvider.tsx`.

Should be:
- Persist wishlist for authenticated buyers.
- Merge local wishlist after login.
- Return product snapshots or populated product summaries.

Suggested routes:

```txt
GET /api/wishlist
POST /api/wishlist
DELETE /api/wishlist/[productId]
```

Suggested create request:

```json
{
  "productId": "product-id"
}
```

### P1 - Review CRUD API

Current state:
- No `app/api/reviews` route exists.
- `components/products/ReviewUploadForm.tsx` stores reviews only in component state.
- Product detail renders hardcoded reviews.
- `models/Review.js` exists, but it stores `productId` and `userId` as strings and allows `rating` up to 6.

Should be:
- Add review list/create/update/delete endpoints.
- Authenticate review creation.
- Optionally require a delivered order before review creation.
- Use `rating` range 1 to 5.
- Store image URLs through a media/upload endpoint, not base64 previews.
- Recompute product rating and AI review summary after review changes.

Suggested routes:

```txt
GET /api/reviews?productId=...
POST /api/reviews
PATCH /api/reviews/[id]
DELETE /api/reviews/[id]
```

Suggested create request:

```json
{
  "productId": "product-id",
  "rating": 5,
  "title": "Great quality",
  "comment": "The product matched the description.",
  "images": ["https://storage.example/review-image.jpg"]
}
```

### P0 - Order Detail, Status, And Cancel API

Current state:
- No `app/api/order/[id]/route.js` exists.
- Buyers cannot view a single order.
- Sellers cannot update order status or tracking.
- Buyers cannot cancel eligible orders.

Should be:
- Add order detail route with buyer/seller authorization.
- Add status transitions with role checks.
- Restore stock when an order is cancelled before fulfillment.

Suggested routes:

```txt
GET /api/order/[id]
PATCH /api/order/[id]
POST /api/order/[id]/cancel
```

Suggested status update request:

```json
{
  "status": "shipped",
  "trackingNumber": "TRACK123",
  "expectedDelivery": "2026-07-01T00:00:00.000Z"
}
```

### P0 - Payment API

Current state:
- No payment API files exist.
- Checkout UI only supports a local cash-on-delivery preview.
- Card payment is disabled.
- `models/Order.js` has payment status fields, but no provider flow updates them.

Should be:
- For COD, `POST /api/order` can create an unpaid pending order.
- For online payment, add create, verify, webhook, and refund routes.
- Store provider reference IDs and update order `paymentStatus`.
- Verify webhook signatures server-side.

Suggested routes:

```txt
POST /api/payments/create
POST /api/payments/verify
POST /api/payments/webhook
POST /api/payments/refund
```

Suggested create request:

```json
{
  "orderId": "BZ-20260626-0001",
  "provider": "khalti"
}
```

### P1 - Upload/Media API

Current state:
- No upload route exists.
- Product image is a plain URL string.
- Review image uploads are local previews only.
- Seller documents have no real document/image upload path.

Should be:
- Add a protected upload endpoint.
- Validate file type and size.
- Upload to a storage provider.
- Return permanent URLs.
- Store product/review/seller document URLs in schemas.

Suggested route:

```txt
POST /api/uploads
```

Suggested multipart fields:

```txt
file: image file
purpose: product-image | review-image | seller-document
```

### P0 - Admin APIs

Current state:
- No admin API routes exist.
- Seller signup defaults to pending/submitted, but there is no admin approval endpoint.
- No moderation endpoints exist for products, reviews, orders, refunds, or users.

Should be:
- Add an admin role or admin model.
- Protect all admin routes with role checks.
- Support seller approval/rejection, product moderation, user management, order dispute handling, and reporting.

Suggested routes:

```txt
GET /api/admin/sellers
PATCH /api/admin/sellers/[id]/status
GET /api/admin/products
PATCH /api/admin/products/[id]/moderation
GET /api/admin/orders
GET /api/admin/users
```

### P1 - Seller Operations APIs

Current state:
- Seller dashboard metrics, orders, inventory alerts, payments, and reports are hardcoded.
- Product creation posts to `/api/products`, but seller product list/edit/delete UI is not wired to real endpoints.

Should be:
- Add seller-scoped routes that only return the authenticated seller's data.
- Back the seller dashboard with real orders, inventory, listing health, payouts, and account health.

Suggested routes:

```txt
GET /api/seller/products
GET /api/seller/orders
PATCH /api/seller/orders/[id]
GET /api/seller/metrics
GET /api/seller/payouts
GET /api/seller/account-health
```

## Cross-Cutting Fixes Required

### Auth payload and cookies

Current state:
- Buyer and seller login both set `accessToken` and `refreshToken`.
- Some routes use `decoded.id`; other routes use `decoded._id`.

Should be:
- Standardize token payloads to `{ id, email, role }`.
- Update every route to read the same field.
- Enforce `role` for buyer-only, seller-only, and admin-only endpoints.
- Decide whether buyer and seller sessions share cookies or use separate cookie names.

### Model alignment

Required schema work:
- `models/Order.js`: export an `Order` model and add buyer/seller references needed by routes.
- `models/User.js`: add password reset and email verification fields if those flows stay in user documents.
- `models/Review.js`: use ObjectId refs where useful, cap rating at 5, add timestamps, title, images, purchase/order reference, and uniqueness rules if needed.
- `models/Product.js`: consider multiple images, approval status, sale status, and indexes for category/search/price.
- Add `Cart`, `Wishlist`, `Payment`, and maybe `Admin` models.

### Frontend integration points

Routes are not complete until these UI flows call them:
- `app/checkout/page.tsx` should call `POST /api/order`.
- `app/account/page.tsx` should call `GET /api/order`.
- `components/cart/CartProvider.tsx` should sync with cart endpoints for logged-in buyers.
- `components/wishlist/WishlistProvider.tsx` should sync with wishlist endpoints.
- `components/products/ReviewUploadForm.tsx` should call review endpoints.
- `components/chat/ChatbotButton.tsx` should call `POST /api/ai-chatbot`.
- `components/seller/SellerDashboard.tsx` should load seller products, orders, metrics, and payouts from seller endpoints.

