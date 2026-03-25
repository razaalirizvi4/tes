# Currency Management Guide

## Overview

This document provides guidance on currency management in the Food Delivery Platform, including where currencies should be added, who should manage them, and the recommended approach for handling currencies across the application.

## ⚠️ Important: Multi-Country Platform Requirement

**Your platform will be used in different countries**, which requires **restaurant-level currency support**. This guide recommends **Option 2 (Restaurant-Level Currency)** as the required solution. See the "Recommended Solution" section below for implementation details.

## Current Implementation

### Currency Architecture

The application currently uses a **global currency system** with the following structure:

1. **Currency Definitions** (`src/constants/currency.ts`)

   - Hardcoded list of supported currencies (USD, EUR, GBP, PKR)
   - Each currency has: `code`, `symbol`, and `name`
   - Single source of truth for currency configuration

2. **Global Default Currency** (Settings Table)

   - Stored in the `Settings` model as `defaultCurrency` field
   - Default value: `"USD"`
   - Managed by Super Admin only
   - Accessed via `/api/settings` endpoint

3. **Currency Display**

   - All prices throughout the application use the global `defaultCurrency`
   - The `useCurrency()` hook fetches currency from settings
   - Prices are formatted using `formatCurrency()` utility function

4. **Restaurant Model**
   - **No currency field exists** in the Restaurant schema
   - All restaurants share the same global currency
   - Prices (minimumOrder, deliveryCharges, menuItem prices) are stored as numbers without currency association

### Current Flow

```
┌─────────────────────────────────────────┐
│   Super Admin                           │
│   Sets defaultCurrency in Settings      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Settings.defaultCurrency (Database)   │
│   Example: "USD"                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   useCurrency() Hook                    │
│   Fetches from /api/settings            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   All Price Displays                    │
│   - Restaurant minimumOrder             │
│   - Menu item prices                    │
│   - Delivery charges                    │
│   - Order totals                        │
└─────────────────────────────────────────┘
```

## Key Findings

### What Works Well

1. ✅ **Centralized Management**: Single source of truth for currency configuration
2. ✅ **Simple Implementation**: No complex currency conversion logic required
3. ✅ **Consistent Display**: All prices use the same currency symbol consistently
4. ✅ **Super Admin Control**: Currency is managed at the platform level

### Current Limitations

1. ⚠️ **No Multi-Currency Support**: All restaurants must use the same currency
2. ⚠️ **Restricted Flexibility**: Vendors cannot set their own currency
3. ⚠️ **Hardcoded Currency List**: New currencies require code changes
4. ⚠️ **No Currency Conversion**: Cannot handle different currencies for international operations

## Recommended Approach

### Option 1: Global Currency (Current Implementation)

**Best For**: Single-country or single-region operations

**Implementation**:

- ✅ **Super Admin** manages currency in Settings
- ✅ Currency is global for entire platform
- ✅ Vendors do NOT set currency when creating restaurants
- ✅ All prices displayed in the same currency

**Pros**:

- Simple and easy to maintain
- Consistent user experience
- No confusion about currency differences
- Suitable for platforms operating in one region

**Cons**:

- Not suitable for multi-country operations
- Cannot support restaurants in different countries with different currencies

**When to Use**:

- Platform operates in a single country
- All restaurants are in the same geographic region
- No need for currency conversion

### Option 2: Restaurant-Level Currency (RECOMMENDED for Multi-Country)

**Best For**: Multi-country or multi-region operations ✅ **YOUR USE CASE**

**Implementation Steps**:

#### 1. Database Schema Update

Add `currency` field to Restaurant model in `prisma/schema.prisma`:

```prisma
model Restaurant {
  id              String        @id @default(cuid())
  name            String
  chainName       String
  address         String
  latitude        Float
  longitude       Float
  cuisineType     String
  segment         String
  city            String
  area            String
  rating          Float?
  coverImage      String?
  coverImagesList String[]
  deliveryTime    String?
  minimumOrder    String?
  deliveryCharges Float?
  currency        String        @default("USD")  // ← ADD THIS FIELD
  spottedDate     DateTime?
  closedDate      DateTime?
  menuItems       MenuItem[]
  orders          Order[]
  vendorId        String
  vendor          VendorProfile @relation(fields: [vendorId], references: [id])
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([vendorId])
}
```

**Migration Command**:

```bash
npx prisma migrate dev --name add_currency_to_restaurant
```

#### 2. Update TypeScript Types

Update `src/types/index.ts`:

```typescript
export interface Restaurant {
  // ... existing fields
  currency?: string; // Currency code (USD, EUR, PKR, etc.)
}
```

#### 3. Update Restaurant Form

Modify `src/app/dashboard/restaurants/RestaurantForm.tsx`:

- Import `getAllCurrencies` from `@/constants/currency`
- Add currency dropdown field in form
- Default to `settings.defaultCurrency` if editing existing restaurant
- Include currency in form submission

#### 4. Update API Endpoints

Modify `src/app/api/restaurants/route.ts`:

- Accept `currency` in POST/PATCH requests
- Validate currency against available currencies
- Store currency with restaurant data

#### 5. Update Display Logic

Replace global currency usage with restaurant-specific currency:

- Update `useCurrency()` hook to accept restaurant currency parameter
- Create `useRestaurantCurrency(restaurantId)` hook OR
- Pass currency directly to formatCurrency function in components
- Update all price displays to use restaurant's currency

**Implementation Example**:

```typescript
// In RestaurantForm.tsx
import { getAllCurrencies } from "@/constants/currency";

// Add to formData state
const [formData, setFormData] = useState({
  // ... existing fields
  currency: restaurant?.currency || settings.defaultCurrency,
});

// Add currency field in form JSX
<div>
  <label className="block text-sm font-medium text-gray-700">Currency*</label>
  <select
    value={formData.currency}
    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
    required
  >
    {getAllCurrencies().map((curr) => (
      <option key={curr.code} value={curr.code}>
        {curr.code} ({curr.symbol}) - {curr.name}
      </option>
    ))}
  </select>
</div>;
```

**Pros**:

- ✅ Supports international operations
- ✅ Flexible for multi-country platforms
- ✅ Each restaurant operates in local currency
- ✅ Better customer experience (local pricing)
- ✅ Essential for payment processing in local currencies

**Cons**:

- ⚠️ More complex implementation
- ⚠️ Need to handle currency display consistently
- ⚠️ Cart/checkout may show different currencies (requires handling)

**Critical Considerations**:

1. **Cart/Order Handling**: When customer adds items from restaurants with different currencies, decide:

   - Option A: Prevent mixing restaurants with different currencies in cart
   - Option B: Convert all prices to a single currency (requires exchange rate API)
   - Option C: Allow mixed currencies but clearly display each

2. **Default Currency Fallback**: Always have a default currency for:

   - New restaurants (inherit from settings.defaultCurrency)
   - Legacy restaurants without currency field
   - Error cases

3. **Currency Validation**: Validate currency codes against your allowed currencies list

**When to Use**:

- ✅ Platform operates in multiple countries (YOUR CASE)
- ✅ Restaurants span different geographic regions
- ✅ Need to support local currencies
- ✅ International payment processing required

### Option 3: Hybrid Approach (Advanced)

**Best For**: Platforms expanding internationally

**Implementation**:

- Super Admin sets default currency and manages available currencies
- Vendors can optionally override with restaurant-specific currency
- Falls back to default currency if not set
- Supports currency conversion in cart/checkout

## Recommended Solution: Option 2 (Restaurant-Level Currency)

**⚠️ IMPORTANT**: Since your platform will be used in different countries, **Option 2 (Restaurant-Level Currency)** is strongly recommended.

### Why Restaurant-Level Currency for Multi-Country Operations?

1. **Local Currency Support**: Restaurants can operate in their local currency (USD, EUR, PKR, etc.)
2. **Customer Clarity**: Customers see prices in familiar local currency
3. **Business Flexibility**: Vendors can price products appropriately for their market
4. **International Expansion**: Essential for platforms serving multiple countries
5. **Payment Processing**: Aligns with local payment methods and expectations

### Implementation Priority: HIGH

This is a critical architectural decision that should be implemented before or early in multi-country deployment.

### Implementation Guidelines

#### For Super Admin (Multi-Country Setup)

1. **Adding/Managing Currencies**:

   - Currencies are defined in `src/constants/currency.ts`
   - Add currencies for all countries you operate in:
     ```typescript
     CURRENCIES: {
       USD: { code: "USD", symbol: "$", name: "US Dollar" },
       EUR: { code: "EUR", symbol: "€", name: "Euro" },
       GBP: { code: "GBP", symbol: "£", name: "British Pound" },
       PKR: { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
       INR: { code: "INR", symbol: "₹", name: "Indian Rupee" },
       AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
       // Add more as needed
     }
     ```
   - Use ISO 4217 currency codes for consistency

2. **Setting Default Currency**:

   - Navigate to Dashboard → Settings → General Settings
   - Select "Default Currency" from dropdown
   - This is used as fallback for new restaurants
   - Choose the most common currency in your primary market

3. **Currency Management Best Practices**:
   - Regularly review which currencies are actively used
   - Ensure all currencies in use have correct symbols
   - Consider currency symbol display on different devices/fonts

#### For Vendors (Multi-Country Operations)

1. **Creating Restaurants**:

   - **MUST select currency** when creating restaurants
   - Choose currency matching the restaurant's operating country
   - Currency cannot be easily changed after creation (ensure correct selection)

2. **Editing Restaurants**:

   - Can change currency when editing (with caution)
   - Changing currency doesn't convert prices automatically
   - Manually update prices if changing currency

3. **Best Practices for Vendors**:
   - Select correct currency for their country/region
   - Enter prices in the selected currency (numbers only)
   - Verify currency selection before saving
   - Contact support if wrong currency was selected

#### Multi-Country Workflow

```
1. Super Admin adds currencies to constants/currency.ts (all countries)
2. Super Admin sets defaultCurrency in Settings (most common currency)
3. Vendor creates restaurant → MUST select currency from dropdown
4. Vendor enters prices in selected currency (numbers only)
5. System displays prices with restaurant's currency symbol
6. Customers see prices in restaurant's local currency
```

#### Cart & Order Handling Strategy

**Recommended Approach**: Prevent mixing restaurants with different currencies

```typescript
// Pseudo-code for cart validation
if (cartRestaurant.currency !== newRestaurant.currency) {
  showError("Cannot add items from restaurants with different currencies.
             Please complete current order or clear cart.");
  return;
}
```

**Alternative**: Show warning but allow, with clear currency indicators:

- Display each item's currency clearly
- Show totals in each currency separately
- Or convert to single currency at checkout (requires exchange rate API)

## Migration Path (If Moving to Option 2)

If you decide to implement restaurant-level currency in the future:

1. **Database Migration**:

   ```sql
   ALTER TABLE "Restaurant" ADD COLUMN "currency" TEXT DEFAULT 'USD';
   ```

2. **Update Restaurant Form**:

   - Add currency dropdown field
   - Populate from `getAllCurrencies()` function
   - Default to `settings.defaultCurrency`

3. **Update Display Logic**:

   - Replace `useCurrency()` with restaurant-specific currency lookup
   - Update all price displays to use restaurant currency

4. **Update API**:
   - Include currency in restaurant creation/update endpoints
   - Validate currency against available currencies list

## Code References

### Key Files

- **Currency Constants**: `src/constants/currency.ts`
- **Currency Hook**: `src/hooks/useCurrency.ts`
- **Currency Utils**: `src/utils/currency.ts`
- **Settings API**: `src/app/api/settings/route.ts`
- **Settings Page**: `src/app/dashboard/settings/page.tsx`
- **Restaurant Form**: `src/app/dashboard/restaurants/RestaurantForm.tsx`
- **Database Schema**: `prisma/schema.prisma` (Settings model)

### Key Functions

- `getAllCurrencies()`: Returns all available currencies
- `getCurrencySymbol(code)`: Gets symbol for currency code
- `formatCurrency(amount, currencyCode, decimals)`: Formats price with symbol
- `useCurrency()`: React hook for accessing global currency

## Best Practices

1. **Currency List Management**:

   - Always update `src/constants/currency.ts` when adding currencies
   - Use ISO 4217 currency codes (USD, EUR, GBP, etc.)
   - Ensure symbols are correctly displayed

2. **Price Input**:

   - Store prices as numbers (Float) without currency
   - Currency is for display only
   - Never store currency symbols with price values

3. **User Experience**:

   - Show currency symbol clearly on all price displays
   - Use consistent formatting across the application
   - Consider adding currency info in footer/header for clarity

4. **Testing**:
   - Test price formatting with different currencies
   - Verify currency symbol displays correctly
   - Test settings update flow for super admin

## Summary

**⚠️ YOUR PLATFORM REQUIREMENT**: Multi-Country Operations

**Recommended Approach**: ✅ **Restaurant-Level Currency (Option 2)**

### Implementation Plan

1. **Phase 1: Database & Schema** (Priority: HIGH)

   - Add `currency` field to Restaurant model
   - Create and run migration
   - Update TypeScript types

2. **Phase 2: Restaurant Management** (Priority: HIGH)

   - Update RestaurantForm to include currency selection
   - Update API endpoints to handle currency
   - Set default currency for existing restaurants

3. **Phase 3: Display Logic** (Priority: HIGH)

   - Update price formatting to use restaurant currency
   - Update all price displays across the application
   - Test currency display consistency

4. **Phase 4: Cart & Checkout** (Priority: MEDIUM)
   - Decide on multi-currency cart strategy
   - Implement currency handling in checkout
   - Consider currency conversion if needed

### Who Manages What?

- **Super Admin**:

  - Manages available currencies in `src/constants/currency.ts`
  - Sets platform default currency in Settings (used as fallback)
  - Can view all restaurants and their currencies

- **Vendors**:
  - **MUST select currency** when creating restaurants
  - Can change currency when editing restaurants
  - Currency should match their operating country

### Quick Start Implementation

See detailed implementation steps in **Option 2** section above. This is a critical feature for multi-country operations and should be prioritized.

---

_Last Updated: Based on current codebase analysis_
_Recommended by: System Architecture Review_
