# Role Structure Documentation

## Overview

The application now uses a dual-role system to separate authentication permissions from property relationships.

## Role Types

### 1. Authentication Roles (`role` field)

Controls system-level permissions and access:

- **`user`** - Default role for regular users
- **`admin`** - Administrative privileges (can manage all users, approve announcements, etc.)

### 2. Property Roles (`propertyRole` field)

Defines the user's relationship to their apartment:

- **`tenant`** - Rents the apartment
- **`owner`** - Owns the apartment
- **`undefined`** - Not yet assigned (triggers onboarding flow)

## User Flow

### First Login

1. User authenticates via Firebase Auth
2. System creates user with `role: 'user'` and `propertyRole: undefined`
3. User is prompted to select apartment and property role (tenant/owner)
4. User can now access the full application

### Role Management

- **System Role**: Only admins can change authentication roles (user ↔ admin)
- **Property Role**: Can be updated through user management interface
- **Apartment Assignment**: Can be changed by admins or during onboarding

## UI Changes

### User Management

- Edit User Dialog now shows both "System Role" and "Property Role" fields
- Add User Dialog includes both role types
- User table displays both roles with different badge styles

### Onboarding

- Select Apartment Dialog now uses `propertyRole` instead of `role`
- Triggers when user has no apartment or property role assigned

## Technical Implementation

### Type Definition

```typescript
export type User = {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin'; // Authentication role
  propertyRole?: 'tenant' | 'owner'; // Property relationship
  fcmToken?: string;
  apartment?: string;
};
```

### Permission Checks

- Admin features: `user.role === 'admin'`
- Property-specific logic: `user.propertyRole === 'owner'` or `user.propertyRole === 'tenant'`
- Onboarding trigger: `!user.apartment || !user.propertyRole`

## Benefits

1. **Clear Separation**: Authentication permissions separate from property relationships
2. **Flexible Management**: Admins can manage system access independently of property roles
3. **Better UX**: Users understand their system role vs. their apartment role
4. **Scalable**: Easy to add new authentication roles or property relationships in the future
