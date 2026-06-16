import type { Config, Plugin } from 'payload'
import type { ReviewsPluginOptions } from './types'
import { getReviewsCollection } from './collections/Reviews'

export const reviewsPlugin =
  (options: ReviewsPluginOptions = {}): Plugin =>
  (incomingConfig: Config): Config => {
    const {
      enabled = true,
      productsCollection = 'products',
      adminEmail,
    } = options

    if (!enabled) return incomingConfig

    const reviewsCollection = getReviewsCollection({ productsCollection })

    return {
      ...incomingConfig,
      collections: [
        ...(incomingConfig.collections || []),
        reviewsCollection,
      ],
    }
  }

export type { ReviewsPluginOptions } from './types'
