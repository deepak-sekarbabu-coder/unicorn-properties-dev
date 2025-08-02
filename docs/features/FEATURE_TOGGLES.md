# Feature Toggles Documentation

This document explains how to use feature toggles in the apartment sharing application.

## Overview

Feature toggles allow you to enable or disable features without deploying new code. This is useful for:

- **Environment-specific features** (e.g., demo features only in development)
- **Gradual rollouts** (enable features for specific environments first)
- **A/B testing** (show different features to different users)
- **Emergency feature disabling** (quickly disable problematic features)

## Available Feature Toggles

Currently, the application uses a generic feature flag system that can be extended for any new features.

## Configuration

### Environment Files

#### `.env` (Local Development)

```bash
# Feature Toggles
NEXT_PUBLIC_ENABLE_MY_FEATURE=true
```

#### `.env.example` (Template)

```bash
# Feature Toggles
# Enable/disable specific features
# Set to 'true' to enable feature, 'false' to disable it
NEXT_PUBLIC_ENABLE_MY_FEATURE=false
```

### Production Deployment

For production deployments, set the environment variable in your hosting platform:

#### Netlify

```bash
# In Netlify dashboard: Site settings > Environment variables
NEXT_PUBLIC_ENABLE_MY_FEATURE=false
```

#### Docker

```dockerfile
ENV NEXT_PUBLIC_ENABLE_MY_FEATURE=false
```

## Usage in Code

### Checking Feature Flags

```typescript
// Generic feature flag check
import { FeatureFlags } from '@/lib/feature-flags';

// Simple check
const isEnabled = FeatureFlags.isFeatureEnabled('NEXT_PUBLIC_MY_FEATURE', false);
```

### Component Conditional Rendering

```typescript
import { FeatureFlags } from '@/lib/feature-flags';

export function NavigationMenu() {
  const isMyFeatureEnabled = FeatureFlags.isFeatureEnabled('NEXT_PUBLIC_MY_FEATURE');

  return (
    <nav>
      {/* Always visible items */}
      <MenuItem>Dashboard</MenuItem>
      <MenuItem>Expenses</MenuItem>

      {/* Conditionally visible items */}
      {isMyFeatureEnabled && (
        <MenuItem>My Feature</MenuItem>
      )}
    </nav>
  );
}
```

### Route Protection

```typescript
// In main app component
switch (view) {
  case 'my-feature':
    if (!FeatureFlags.isFeatureEnabled('NEXT_PUBLIC_MY_FEATURE')) {
      setView('dashboard');
      return null;
    }
    return <MyFeaturePage />;
}
```

## Implementation Details

### Feature Flag Utility (`src/lib/feature-flags.ts`)

```typescript
export const FeatureFlags = {
  isFeatureEnabled: (flagName: string, defaultValue: boolean = false): boolean => {
    const envValue = process.env[flagName];
    if (envValue === undefined) return defaultValue;
    return envValue === 'true';
  },
} as const;
```

## Best Practices

- Use `NEXT_PUBLIC_ENABLE_` prefix for client-side flags
- Use descriptive names: `NEXT_PUBLIC_ENABLE_MY_FEATURE`
- Use boolean values: `true` or `false`
- Remove feature flags when features are stable
- Clean up unused environment variables
- Update documentation

## Security Considerations

- `NEXT_PUBLIC_` variables are exposed to the browser
- Don't use for sensitive feature controls
- Suitable for UI/UX toggles

## Troubleshooting

- Check environment variable is set correctly
- Verify variable name matches exactly
- Ensure value is exactly `'true'` (string)
- Restart development server after changes
