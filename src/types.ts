export interface ReviewsPluginOptions {
  /**
   * Enable or disable the plugin.
   * @default true
   */
  enabled?: boolean

  /**
   * The slug of the products collection to relate reviews to.
   * @default 'products'
   */
  productsCollection?: string

  /**
   * Admin email to notify on new review submission.
   * If not provided, no email is sent.
   */
  adminEmail?: string
}
