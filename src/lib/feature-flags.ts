/**
 * Feature flags utility for controlling feature visibility
 */

export const FeatureFlags = {
  /**
   * Check if payment demo feature is enabled
   * @returns boolean indicating if payment demo should be shown
   */
  isPaymentDemoEnabled: (): boolean => {
    return process.env.NEXT_PUBLIC_ENABLE_PAYMENT_DEMO === 'true';
  },

  /**
   * Generic feature flag checker
   * @param flagName - The environment variable name
   * @param defaultValue - Default value if env var is not set
   * @returns boolean indicating if feature is enabled
   */
  isFeatureEnabled: (flagName: string, defaultValue: boolean = false): boolean => {
    const envValue = process.env[flagName];
    if (envValue === undefined) return defaultValue;
    return envValue === 'true';
  },
} as const;

// Export individual feature flags for convenience
export const isPaymentDemoEnabled = FeatureFlags.isPaymentDemoEnabled;
