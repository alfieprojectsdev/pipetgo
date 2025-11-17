/**
 * GoatCounter Level 2 Analytics - Event Tracking
 *
 * Privacy-first event tracking for PipetGo B2B marketplace.
 *
 * IMPORTANT: Only track anonymous usage patterns.
 * NEVER track personal data (names, emails, prices, user IDs).
 *
 * @see docs/ADR_GOATCOUNTER_LEVEL1_ANALYTICS.md
 */

/**
 * Track a custom event in GoatCounter
 *
 * Events appear in GoatCounter dashboard as `/event/{eventName}`
 *
 * @param eventName - Descriptive event name (kebab-case recommended)
 * @param metadata - Optional anonymous metadata (NO personal data)
 *
 * @example
 * ```typescript
 * // Track quote request (anonymous)
 * trackEvent('quote-requested');
 *
 * // Track with category metadata
 * trackEvent('service-filter-applied', { category: 'chemical-analysis' });
 * ```
 */
export function trackEvent(eventName: string, metadata?: Record<string, string | number | boolean>) {
  // Only track if GoatCounter is loaded (production environment)
  if (typeof window === 'undefined' || !window.goatcounter) {
    return
  }

  try {
    const path = metadata
      ? `/event/${eventName}?${new URLSearchParams(metadata as Record<string, string>).toString()}`
      : `/event/${eventName}`

    window.goatcounter.count({
      path,
      title: eventName,
      event: true
    })
  } catch (error) {
    // Silently fail - analytics should never break app functionality
    console.warn('Analytics tracking failed:', error)
  }
}

/**
 * Predefined event tracking functions for common PipetGo actions
 */
export const analytics = {
  /**
   * Track when a client requests a quote
   */
  quoteRequested: () => trackEvent('quote-requested'),

  /**
   * Track when a lab provides a quote
   */
  quoteProvided: () => trackEvent('quote-provided'),

  /**
   * Track when a client approves a quote
   */
  quoteApproved: () => trackEvent('quote-approved'),

  /**
   * Track when an order is created
   * @param mode - Pricing mode used (FIXED, HYBRID, QUOTE_REQUIRED)
   */
  orderCreated: (mode?: 'FIXED' | 'HYBRID' | 'QUOTE_REQUIRED') =>
    trackEvent('order-created', mode ? { mode } : undefined),

  /**
   * Track when a user completes signup
   * @param role - User role (CLIENT or LAB_ADMIN, NO user identification)
   */
  signupCompleted: (role: 'CLIENT' | 'LAB_ADMIN') =>
    trackEvent('signup-completed', { role }),

  /**
   * Track when lab search is used
   */
  labSearchUsed: () => trackEvent('lab-search-used'),

  /**
   * Track when service filter is applied
   * @param category - Service category (anonymous, no user data)
   */
  serviceFilterApplied: (category: string) =>
    trackEvent('service-filter-applied', { category })
}

// TypeScript declaration for window.goatcounter (if not already declared)
declare global {
  interface Window {
    goatcounter?: {
      count: (vars: { path: string; title?: string; event?: boolean }) => void
    }
  }
}
