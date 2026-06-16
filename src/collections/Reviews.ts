import type { CollectionConfig } from 'payload'

interface GetReviewsCollectionOptions {
  productsCollection: string
}

export const getReviewsCollection = ({
  productsCollection,
}: GetReviewsCollectionOptions): CollectionConfig => ({
  slug: 'reviews',
  labels: {
    singular: 'Review',
    plural: 'Reviews',
  },
  admin: {
    useAsTitle: 'authorName',
    defaultColumns: ['authorName', 'product', 'rating', 'status', 'createdAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: () => true,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: productsCollection,
      required: true,
      label: 'Product',
    },
    {
      name: 'authorName',
      type: 'text',
      required: true,
      label: 'Author Name',
      maxLength: 80,
    },
    {
      name: 'authorEmail',
      type: 'email',
      required: true,
      label: 'Author Email',
      access: { read: ({ req }) => Boolean(req.user) },
      admin: {
        description: 'Used for verification only, never displayed publicly.',
      },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      label: 'Rating (1-5)',
      min: 1,
      max: 5,
    },
    {
      name: 'title',
      type: 'text',
      label: 'Review Title',
      maxLength: 120,
    },
    {
      name: 'comment',
      type: 'textarea',
      required: true,
      label: 'Comment',
      maxLength: 1000,
    },
    {
      name: 'verified',
      type: 'checkbox',
      label: 'Verified Purchase',
      defaultValue: false,
      admin: {
        description: 'Check if the reviewer has purchased this product.',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.status) data.status = 'pending'
        // Prevent users from self-verifying purchases
        if (data.verified) data.verified = false
        return data
      },
    ],
  },
})
