# Feature Toggles Documentation

This document explains how to use feature toggles in the apartment sharing application.

## Overview

Feature toggles allow you to enable or disable features without deploying new code. This is useful for:

- **Environment-specific features** (e.g., demo features only in development)
- **Gradual rollouts** (enable features for specific environments first)
- **A/B testing** (show different features to different users)
- **Emergency feature disabling** (quickly disable problematic features)

## Available Feature Toggles

### Payment Demo Feature

**Environment Variable:** `NEXT_PUBLIC_ENABLE_PAYMENT_DEMO`

**Description:** Controls whether the Payment Integration Demo page is visible in the navigation and accessible to users.

**Values:**

- `true` - Payment demo is visible and accessible
- `false` - Payment demo is hidden from navigation and inaccessible

**Default:** `true` (if not set, defaults to `false`)

## Configuration

### Environment Files

#### `.env` (Local Development)

```bash
# Feature Toggles
NEXT_PUBLIC_ENABLE_PAYMENT_DEMO=true
```

#### `.env.example` (Template)

```bash
# Feature Toggles
# Enable/disable the payment demo feature
# Set to 'true' to show payment demo in navigation, 'false' to hide it
NEXT_PUBLIC_ENABLE_PAYMENT_DEMO=true
```

### Production Deployment

For production deployments, set the environment variable in your hosting platform:

#### Vercel

```bash
vercel env add NEXT_PUBLIC_ENABLE_PAYMENT_DEMO
# Enter value: false (for production)
```

#### Netlify

```bash
# In Netlify dashboard: Site settings > Environment variables
NEXT_PUBLIC_ENABLE_PAYMENT_DEMO=false
```

#### Docker

```dockerfile
ENV NEXT_PUBLIC_ENABLE_PAYMENT_DEMO=false
```

## Usage in Code

### Checking Feature Flags

```typescript
import { isPaymentDemoEnabled } from '@/lib/feature-flags';
// Generic feature flag check
import { FeatureFlags } from '@/lib/feature-flags';

// Simple check
if (isPaymentDemoEnabled()) {
  // Feature is enabled
}

const isEnabled = FeatureFlags.isFeatureEnabled('NEXT_PUBLIC_MY_FEATURE', false);
```

### Component Conditional Rendering

```typescript
import { isPaymentDemoEnabled } from '@/lib/feature-flags';

export function NavigationMenu() {
  return (
    <nav>
      {/* Always visible items */}
      <MenuItem>Dashboard</MenuItem>
      <MenuItem>Expenses</MenuItem>

      {/* Conditionally visible items */}
      {isPaymentDemoEnabled() && (
        <MenuItem>Payment Demo</MenuItem>
      )}
    </nav>
  );
}
```

### Route Protection

```typescript
// In main app component
switch (view) {
  case 'payment-demo':
    if (!isPaymentDemoEnabled()) {
      setView('dashboard');
      return null;
    }
    return <PaymentDemoPage />;
}
```

## Implementation Details

### Feature Flag Utility (`src/lib/feature-flags.ts`)

```typescript
export const FeatureFlags = {
  isPaymentDemoEnabled: (): boolean => {
    return process.env.NEXT_PUBLIC_ENABLE_PAYMENT_DEMO === 'true';
  },

  isFeatureEnabled: (flagName: string, defaultValue: boolean = false): boolean => {
    const envValue = process.env[flagName];
    if (envValue === undefined) return defaultValue;
    return envValue === 'true';
  },
} as const;
```

### Components Updated

1. **NavigationMenu** - Conditionally shows payment demo link
2. **UnicornPropertiesApp** - Protects payment demo route
3. **PageHeader** - Conditionally shows payment demo title

## Environment-Specific Recommendations

### Development

```bash
NEXT_PUBLIC_ENABLE_PAYMENT_DEMO=true
```

- Enable all features for testing
- Useful for demonstrating functionality

### Staging

```bash
NEXT_PUBLIC_ENABLE_PAYMENT_DEMO=true
```

- Test features before production
- Validate feature toggle behavior

### Production

```bash
NEXT_PUBLIC_ENABLE_PAYMENT_DEMO=false
```

- Disable demo/experimental features
- Only show production-ready functionality

## Adding New Feature Toggles

### 1. Add Environment Variable

Add to `.env.example`:

```bash
# New Feature Toggle
NEXT_PUBLIC_ENABLE_NEW_FEATURE=false
```

### 2. Update Feature Flags Utility

```typescript
// src/lib/feature-flags.ts
export const FeatureFlags = {
  // ... existing flags

  isNewFeatureEnabled: (): boolean => {
    return process.env.NEXT_PUBLIC_ENABLE_NEW_FEATURE === 'true';
  },
} as const;

export const isNewFeatureEnabled = FeatureFlags.isNewFeatureEnabled;
```

### 3. Use in Components

```typescript
import { isNewFeatureEnabled } from '@/lib/feature-flags';

export function MyComponent() {
  return (
    <div>
      {isNewFeatureEnabled() && (
        <NewFeatureComponent />
      )}
    </div>
  );
}
```

## Best Practices

### 1. Naming Convention

- Use `NEXT_PUBLIC_ENABLE_` prefix for client-side flags
- Use descriptive names: `NEXT_PUBLIC_ENABLE_PAYMENT_DEMO`
- Use boolean values: `true` or `false`

### 2. Default Values

- Always provide sensible defaults
- Document the default behavior
- Consider security implications

### 3. Documentation

- Document each feature flag
- Explain when to enable/disable
- Provide usage examples

### 4. Cleanup

- Remove feature flags when features are stable
- Clean up unused environment variables
- Update documentation

## Security Considerations

### Client-Side Flags

- `NEXT_PUBLIC_` variables are exposed to the browser
- Don't use for sensitive feature controls
- Suitable for UI/UX toggles

### Server-Side Flags

- Use regular environment variables (without `NEXT_PUBLIC_`)
- Better for security-sensitive features
- Require server-side checks

## Troubleshooting

### Feature Not Showing

1. Check environment variable is set correctly
2. Verify variable name matches exactly
3. Ensure value is exactly `'true'` (string)
4. Restart development server after changes

### Feature Still Showing When Disabled

1. Check for cached builds
2. Verify all conditional checks are in place
3. Clear browser cache
4. Check for typos in variable names

### Environment Variable Not Loading

1. Ensure `.env` file is in project root
2. Check file is not in `.gitignore`
3. Restart development server
4. Verify Next.js can access the variable

## Monitoring

Consider adding analytics to track feature usage:

```typescript
// Track feature flag usage
if (isPaymentDemoEnabled()) {
  analytics.track('feature_flag_enabled', {
    feature: 'payment_demo',
    timestamp: new Date().toISOString(),
  });
}
```

This helps understand feature adoption and usage patterns.
