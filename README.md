# payload-plugin-reviews

A [Payload CMS v3](https://payloadcms.com) plugin to add customer reviews with moderation, star ratings, and Google rich snippets (Schema.org) support.

## Features

- ⭐ Star rating system (1–5)
- 🛡️ Admin moderation (pending / approved / rejected)
- ✔️ Verified purchase badge (admin-only)
- 📧 Author email hidden from public API
- 🔍 Google rich snippets ready (Schema.org `aggregateRating`)
- 🌐 Works with any products collection slug

## Installation

```bash
npm install payload-plugin-reviews
```

## Usage

### 1. Add the plugin to your Payload config

```typescript
// payload.config.ts
import { reviewsPlugin } from 'payload-plugin-reviews'

export default buildConfig({
  plugins: [
    reviewsPlugin({
      productsCollection: 'products', // default
    }),
  ],
})
```

### 2. Create the database table

> ⚠️ If Payload is running in `dev` mode (migration batch `-1`), the table won't be created automatically. Run this SQL manually:

```sql
CREATE TYPE "public"."enum_reviews_status" AS ENUM('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS "reviews" (
  "id" serial PRIMARY KEY,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE SET NULL,
  "author_name" varchar NOT NULL,
  "author_email" varchar NOT NULL,
  "rating" numeric NOT NULL,
  "title" varchar,
  "comment" varchar NOT NULL,
  "verified" boolean DEFAULT false,
  "status" "enum_reviews_status" DEFAULT 'pending',
  "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
  "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "reviews_created_at_idx" ON "reviews" USING btree ("created_at");

ALTER TABLE "payload_locked_documents_rels"
  ADD COLUMN IF NOT EXISTS "reviews_id" integer REFERENCES "reviews"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reviews_id_idx"
  ON "payload_locked_documents_rels" USING btree ("reviews_id");
```

### 3. Add the API route (Next.js App Router)

Create `src/app/(app)/api/reviews/product/[productId]/route.ts`:

```typescript
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const payload = await getPayload({ config: configPromise })

  const reviews = await payload.find({
    collection: 'reviews',
    where: {
      and: [
        { product: { equals: parseInt(productId, 10) } },
        { status: { equals: 'approved' } },
      ],
    },
    sort: '-createdAt',
    limit: 50,
  })

  const avg =
    reviews.docs.length > 0
      ? reviews.docs.reduce((acc, r) => acc + (r.rating as number), 0) / reviews.docs.length
      : 0

  return Response.json({
    docs: reviews.docs,
    totalDocs: reviews.totalDocs,
    averageRating: Math.round(avg * 10) / 10,
  })
}
```

### 4. Add frontend components

Copy the following components to your project:

- `StarRating.tsx` — star display and interactive picker
- `ReviewForm.tsx` — public review submission form
- `ReviewsList.tsx` — reviews list with average, distribution bars, and form toggle

See the `/examples` folder for full source.

### 5. Add to your product page

```tsx
import { ReviewsList } from '@/components/ReviewsList'

// In your product page component:
<ReviewsList productId={`${product.id}`} />
```

### 6. Add JSON-LD rich snippets (optional but recommended)

In your product page, fetch reviews server-side and include `aggregateRating` in your JSON-LD:

```typescript
const reviewsData = await payload.find({
  collection: 'reviews',
  where: {
    and: [
      { product: { equals: product.id } },
      { status: { equals: 'approved' } },
    ],
  },
  pagination: false,
})

const avg = reviewsData.docs.length > 0
  ? reviewsData.docs.reduce((a, b) => a + (b.rating as number), 0) / reviewsData.docs.length
  : 0

const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.title,
  ...(reviewsData.docs.length > 0 ? {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Math.round(avg * 10) / 10,
      reviewCount: reviewsData.docs.length,
      bestRating: 5,
      worstRating: 1,
    }
  } : {}),
  offers: {
    '@type': 'AggregateOffer',
    price: product.price / 100, // prices stored in cents
    priceCurrency: 'EUR',
  },
}
```

Test your rich snippets: [Google Rich Results Test](https://search.google.com/test/rich-results)

## Plugin Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | Enable or disable the plugin |
| `productsCollection` | `string` | `'products'` | Slug of your products collection |
| `adminEmail` | `string` | `undefined` | Email to notify on new review (requires email adapter) |

## Notes

- **`parseInt(productId, 10)`** is required when submitting reviews — Payload rejects string IDs for relationship fields.
- **`verified`** is always reset to `false` on creation — only admins can mark a review as verified purchase.
- **Author email** is protected by field-level access control — never exposed in the public API.
- **Prices in cents** — if your prices are stored in cents (e.g. `3990` = €39.90), divide by 100 in JSON-LD and frontend display.

## License

MIT
