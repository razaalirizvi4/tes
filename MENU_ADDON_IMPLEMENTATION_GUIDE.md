# Menu Addon (Customization) Feature — Implementation Guide

## Table of Contents

1. [Overview](#1-overview)
2. [Current State Analysis](#2-current-state-analysis)
3. [Database Schema Design](#3-database-schema-design)
4. [Migration Strategy](#4-migration-strategy)
5. [TypeScript Types](#5-typescript-types)
6. [API Routes](#6-api-routes)
7. [Vendor Dashboard — Addon Management UI](#7-vendor-dashboard--addon-management-ui)
8. [Customer UI — Dynamic Addon Selection](#8-customer-ui--dynamic-addon-selection)
9. [Cart & Order Integration](#9-cart--order-integration)
10. [POS Integration](#10-pos-integration)
11. [File-by-File Change List](#11-file-by-file-change-list)

---

## 1. Overview

**Goal:** Replace hardcoded sizes, toppings, and spice levels with a fully dynamic, vendor-customizable addon system. Vendors can create **Addon Groups** (e.g., "Size", "Spice Level", "Drinks", "Extra Toppings") and **Addon Options** within each group (e.g., "Small — $0", "Large — +$3"). Each addon group is linked to specific menu items or applied to all items in a restaurant.

**Key capabilities:**
- Vendors create/edit/delete addon groups and their options from the dashboard
- Each group has a selection type: `SINGLE` (radio — pick one) or `MULTIPLE` (checkbox — pick many)
- Groups can be marked `required` (customer must pick at least one) or optional
- Each option can have a `priceAdjustment` (positive, negative, or zero)
- Groups can be assigned to individual menu items OR all items in a category
- Customer sees dynamic addon selectors in the item detail modal
- Selected addons are stored in `OrderItem.options` / `POSOrderItem.options` as structured JSON
- **Zero breaking changes** to existing tables

---

## 2. Current State Analysis

### What exists today

| Aspect | Current Implementation | Location |
|---|---|---|
| **Sizes** | Hardcoded `["Small", "Regular", "Large (+ $3.00)"]` | `RestaurantDetails.tsx:374` |
| **Toppings** | Hardcoded array of 3 items | `RestaurantDetails.tsx:219-223` |
| **Spice Level** | Prisma enum `SpicyLevel` on `MenuItem` | `schema.prisma:109`, `MenuItemForm.tsx:155-168` |
| **Options storage** | `Json? options` field on `OrderItem` & `POSOrderItem` | `schema.prisma:197, 237` |
| **Cart options** | `options?: { [key]: string \| number \| boolean \| null }` | `useStore.ts:40-42` |

### Problems with current approach
1. **Not customizable** — vendor cannot change sizes, toppings, or pricing
2. **Hardcoded prices** — `Large (+$3)` is baked into the UI
3. **Spice is per-item enum** — can't add custom spice options or other flavor profiles
4. **No DB persistence** — selected toppings/sizes aren't properly stored in orders
5. **Different items need different addons** — a pizza needs size+toppings, a drink needs size+ice level

---

## 3. Database Schema Design

### New Models (add to `prisma/schema.prisma`)

```prisma
/// A group of addon options (e.g., "Size", "Spice Level", "Extra Toppings", "Drinks")
model AddonGroup {
  id             String        @id @default(cuid())
  restaurantId   String
  name           String                           // "Size", "Spice Level", "Drinks"
  displayName    String?                           // Optional customer-facing label
  selectionType  SelectionType @default(SINGLE)    // SINGLE = radio, MULTIPLE = checkbox
  isRequired     Boolean       @default(false)     // Must pick at least one?
  minSelections  Int           @default(0)         // Min items to select (for MULTIPLE)
  maxSelections  Int?                              // Max items to select (null = unlimited)
  sortOrder      Int           @default(0)         // Display ordering
  isActive       Boolean       @default(true)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  restaurant     Restaurant    @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  options        AddonOption[]
  menuItemAddons MenuItemAddon[]

  @@index([restaurantId])
  @@index([restaurantId, sortOrder])
}

/// An individual option within an addon group (e.g., "Small — $0", "Large — +$3")
model AddonOption {
  id              String     @id @default(cuid())
  addonGroupId    String
  name            String                          // "Small", "Medium", "Large"
  priceAdjustment Float      @default(0)          // +3.00, -1.00, or 0
  isDefault       Boolean    @default(false)       // Pre-selected in UI
  sortOrder       Int        @default(0)
  isActive        Boolean    @default(true)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  addonGroup      AddonGroup @relation(fields: [addonGroupId], references: [id], onDelete: Cascade)

  @@index([addonGroupId])
  @@index([addonGroupId, sortOrder])
}

/// Junction table: which addon groups apply to which menu items
model MenuItemAddon {
  id           String     @id @default(cuid())
  menuItemId   String
  addonGroupId String
  sortOrder    Int        @default(0)           // Order of this group for this item
  createdAt    DateTime   @default(now())

  menuItem     MenuItem   @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  addonGroup   AddonGroup @relation(fields: [addonGroupId], references: [id], onDelete: Cascade)

  @@unique([menuItemId, addonGroupId])          // Prevent duplicates
  @@index([menuItemId])
  @@index([addonGroupId])
}

enum SelectionType {
  SINGLE
  MULTIPLE
}
```

### Changes to existing models (non-breaking)

```prisma
// In model MenuItem — ADD this relation (existing fields unchanged):
model MenuItem {
  // ... all existing fields stay ...
  addonGroups  MenuItemAddon[]   // ← ADD this line
}

// In model Restaurant — ADD this relation:
model Restaurant {
  // ... all existing fields stay ...
  addonGroups  AddonGroup[]      // ← ADD this line
}
```

### Entity Relationship Diagram

```
Restaurant 1──┬──* MenuItem
              │       │
              │       └──* MenuItemAddon (junction)
              │                │
              └──* AddonGroup ─┘
                      │
                      └──* AddonOption
```

**Key design decisions:**
- `MenuItemAddon` is a **junction table** — one addon group can be shared across many menu items (e.g., "Size" group applies to all pizzas)
- `AddonOption.priceAdjustment` is a delta, not absolute — makes it easy to compute final price
- `sortOrder` on groups and options gives vendors full control over display order
- `minSelections`/`maxSelections` enables validation (e.g., "pick 2-4 toppings")
- `isDefault` on options pre-selects common choices (e.g., "Regular" size)
- Cascade deletes ensure cleanup when restaurant or menu item is deleted
- **Existing `spicy` field on MenuItem stays** — it won't break anything. You can optionally deprecate it later

---

## 4. Migration Strategy

### Step 1: Generate migration

```bash
npx prisma migrate dev --name add_menu_addons
```

This will:
- Create `AddonGroup`, `AddonOption`, `MenuItemAddon` tables
- Add the `SelectionType` enum
- Add foreign key indexes
- **NOT** touch any existing table data

### Step 2: Seed default addon groups (optional)

Create a seed script to auto-create default addon groups for existing restaurants so vendors have a starting point:

```typescript
// prisma/seeds/addonSeed.ts
import { prisma } from '@/lib/prisma';

async function seedDefaultAddons() {
  const restaurants = await prisma.restaurant.findMany({ select: { id: true } });

  for (const restaurant of restaurants) {
    // Create "Size" group
    const sizeGroup = await prisma.addonGroup.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Size',
        selectionType: 'SINGLE',
        isRequired: true,
        sortOrder: 0,
        options: {
          create: [
            { name: 'Small', priceAdjustment: 0, isDefault: true, sortOrder: 0 },
            { name: 'Regular', priceAdjustment: 0, sortOrder: 1 },
            { name: 'Large', priceAdjustment: 3.0, sortOrder: 2 },
          ],
        },
      },
    });

    // Create "Spice Level" group
    const spiceGroup = await prisma.addonGroup.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Spice Level',
        selectionType: 'SINGLE',
        isRequired: false,
        sortOrder: 1,
        options: {
          create: [
            { name: 'Mild', priceAdjustment: 0, sortOrder: 0 },
            { name: 'Medium', priceAdjustment: 0, isDefault: true, sortOrder: 1 },
            { name: 'Hot', priceAdjustment: 0, sortOrder: 2 },
          ],
        },
      },
    });

    // Create "Extra Toppings" group
    await prisma.addonGroup.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Extra Toppings',
        selectionType: 'MULTIPLE',
        isRequired: false,
        maxSelections: 5,
        sortOrder: 2,
        options: {
          create: [
            { name: 'Extra Parmesan Cheese', priceAdjustment: 1.5, sortOrder: 0 },
            { name: 'Grilled Chicken Breast', priceAdjustment: 4.0, sortOrder: 1 },
            { name: 'Sliced Black Olives', priceAdjustment: 0.75, sortOrder: 2 },
          ],
        },
      },
    });

    // Assign all groups to all existing menu items
    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId: restaurant.id },
      select: { id: true },
    });

    for (const item of menuItems) {
      await prisma.menuItemAddon.createMany({
        data: [
          { menuItemId: item.id, addonGroupId: sizeGroup.id, sortOrder: 0 },
          { menuItemId: item.id, addonGroupId: spiceGroup.id, sortOrder: 1 },
        ],
        skipDuplicates: true,
      });
    }
  }
}
```

---

## 5. TypeScript Types

### Add to `src/types/index.ts`

```typescript
// ─── Addon Types ───────────────────────────────────────────

export type SelectionType = 'SINGLE' | 'MULTIPLE';

export interface AddonOption {
  id: string;
  addonGroupId: string;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface AddonGroup {
  id: string;
  restaurantId: string;
  name: string;
  displayName?: string | null;
  selectionType: SelectionType;
  isRequired: boolean;
  minSelections: number;
  maxSelections?: number | null;
  sortOrder: number;
  isActive: boolean;
  options: AddonOption[];
}

export interface MenuItemAddon {
  id: string;
  menuItemId: string;
  addonGroupId: string;
  addonGroup: AddonGroup;
  sortOrder: number;
}

// Used when storing selected addons in OrderItem.options
export interface SelectedAddon {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceAdjustment: number;
}

// Update the MenuItem interface to include addons
export interface MenuItem {
  id: string;
  label: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string;
  spicy?: SpicyLevel | null;
  restaurantId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  addonGroups?: MenuItemAddon[];  // ← NEW
}
```

### Update CartItem in `src/store/useStore.ts`

```typescript
export interface CartItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;           // base price of item (without addons)
  name: string;
  image?: string | null;
  restaurantName: string;
  restaurantId: string;
  selectedAddons?: SelectedAddon[];  // ← NEW: structured addon selections
  addonsTotal?: number;              // ← NEW: precomputed addon price sum
  options?: {                        // Keep for backward compatibility
    [key: string]: string | number | boolean | null;
  };
}
```

---

## 6. API Routes

### 6A. Addon Groups CRUD

**File:** `src/app/api/restaurants/[id]/addon-groups/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all addon groups for a restaurant (with options)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const restaurantId = (await params).id;

    const addonGroups = await prisma.addonGroup.findMany({
      where: { restaurantId, isActive: true },
      include: {
        options: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(addonGroups);
  } catch (error) {
    console.error('Error fetching addon groups:', error);
    return NextResponse.json({ error: 'Failed to fetch addon groups' }, { status: 500 });
  }
}

// POST create a new addon group with options
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const restaurantId = (await params).id;
    const body = await request.json();
    const { name, displayName, selectionType, isRequired, minSelections, maxSelections, sortOrder, options } = body;

    const addonGroup = await prisma.addonGroup.create({
      data: {
        restaurantId,
        name,
        displayName,
        selectionType: selectionType || 'SINGLE',
        isRequired: isRequired || false,
        minSelections: minSelections || 0,
        maxSelections: maxSelections || null,
        sortOrder: sortOrder || 0,
        options: {
          create: (options || []).map((opt: any, idx: number) => ({
            name: opt.name,
            priceAdjustment: opt.priceAdjustment || 0,
            isDefault: opt.isDefault || false,
            sortOrder: opt.sortOrder ?? idx,
          })),
        },
      },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json({ addonGroup });
  } catch (error) {
    console.error('Error creating addon group:', error);
    return NextResponse.json({ error: 'Failed to create addon group' }, { status: 500 });
  }
}
```

### 6B. Single Addon Group Operations

**File:** `src/app/api/restaurants/[id]/addon-groups/[groupId]/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PATCH — update addon group and its options
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const { options, ...groupData } = body;

    // Update group fields
    const addonGroup = await prisma.addonGroup.update({
      where: { id: groupId },
      data: groupData,
    });

    // If options are provided, upsert them
    if (options && Array.isArray(options)) {
      for (const opt of options) {
        if (opt.id) {
          // Update existing option
          await prisma.addonOption.update({
            where: { id: opt.id },
            data: {
              name: opt.name,
              priceAdjustment: opt.priceAdjustment,
              isDefault: opt.isDefault,
              sortOrder: opt.sortOrder,
              isActive: opt.isActive,
            },
          });
        } else {
          // Create new option
          await prisma.addonOption.create({
            data: {
              addonGroupId: groupId,
              name: opt.name,
              priceAdjustment: opt.priceAdjustment || 0,
              isDefault: opt.isDefault || false,
              sortOrder: opt.sortOrder || 0,
            },
          });
        }
      }
    }

    // Fetch updated group with options
    const updated = await prisma.addonGroup.findUnique({
      where: { id: groupId },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });

    return NextResponse.json({ addonGroup: updated });
  } catch (error) {
    console.error('Error updating addon group:', error);
    return NextResponse.json({ error: 'Failed to update addon group' }, { status: 500 });
  }
}

// DELETE — soft delete (set isActive = false) or hard delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { groupId } = await params;

    await prisma.addonGroup.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ message: 'Addon group deleted successfully' });
  } catch (error) {
    console.error('Error deleting addon group:', error);
    return NextResponse.json({ error: 'Failed to delete addon group' }, { status: 500 });
  }
}
```

### 6C. Assign Addon Groups to Menu Items

**File:** `src/app/api/restaurants/[id]/menu-items/[mid]/addons/route.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET addon groups assigned to a specific menu item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mid: string }> }
) {
  try {
    const { mid } = await params;

    const menuItemAddons = await prisma.menuItemAddon.findMany({
      where: { menuItemId: mid },
      include: {
        addonGroup: {
          include: {
            options: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(menuItemAddons);
  } catch (error) {
    console.error('Error fetching menu item addons:', error);
    return NextResponse.json({ error: 'Failed to fetch menu item addons' }, { status: 500 });
  }
}

// POST — assign addon groups to a menu item
// Body: { addonGroupIds: string[] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mid: string }> }
) {
  try {
    const { mid } = await params;
    const { addonGroupIds } = await request.json();

    // Remove existing assignments
    await prisma.menuItemAddon.deleteMany({
      where: { menuItemId: mid },
    });

    // Create new assignments
    const data = addonGroupIds.map((groupId: string, idx: number) => ({
      menuItemId: mid,
      addonGroupId: groupId,
      sortOrder: idx,
    }));

    await prisma.menuItemAddon.createMany({ data });

    // Return updated assignments
    const updated = await prisma.menuItemAddon.findMany({
      where: { menuItemId: mid },
      include: {
        addonGroup: {
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error assigning addons:', error);
    return NextResponse.json({ error: 'Failed to assign addons' }, { status: 500 });
  }
}
```

### 6D. Update existing menu item GET to include addons

**File:** `src/app/api/restaurants/[id]/menu-items/route.ts` — update the GET handler:

```typescript
// Updated GET — include addon groups
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const restaurantId = (await params).id;

    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId },
      include: {
        addonGroups: {
          include: {
            addonGroup: {
              include: {
                options: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}
```

Also update the `getRestaurant` server action in `src/app/actions/restaurants.ts` to include addons when fetching menu items.

---

## 7. Vendor Dashboard — Addon Management UI

### 7A. New Component: `AddonGroupManager.tsx`

**File:** `src/components/dashboard/restaurants/AddonGroupManager.tsx`

This component provides a full CRUD interface for managing addon groups at the restaurant level.

**Features:**
- List all addon groups for the restaurant
- Create new group with inline option editor
- Edit group name, selection type, required flag
- Add/remove/reorder options with price adjustment
- Delete groups
- Drag-and-drop reorder (optional, can use simple up/down arrows initially)

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Addon Groups                          [+ Add Group] │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐ │
│  │ 📦 Size  (Required · Single Select)    [Edit][X]│ │
│  │   ├─ Small         $0.00                        │ │
│  │   ├─ Regular       $0.00  ⭐ default            │ │
│  │   └─ Large        +$3.00                        │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 🌶️ Spice Level  (Optional · Single Select) [Edit]│ │
│  │   ├─ Mild          $0.00                        │ │
│  │   ├─ Medium        $0.00  ⭐ default            │ │
│  │   └─ Hot           $0.00                        │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 🧀 Extra Toppings  (Optional · Multi · Max 5)   │ │
│  │   ├─ Parmesan     +$1.50                        │ │
│  │   ├─ Chicken      +$4.00                        │ │
│  │   └─ Olives       +$0.75                        │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Key state:**
```typescript
const [groups, setGroups] = useState<AddonGroup[]>([]);
const [editingGroup, setEditingGroup] = useState<AddonGroup | null>(null);
const [isCreating, setIsCreating] = useState(false);
```

**API calls:**
- `GET /api/restaurants/[id]/addon-groups` — load on mount
- `POST /api/restaurants/[id]/addon-groups` — create
- `PATCH /api/restaurants/[id]/addon-groups/[groupId]` — update
- `DELETE /api/restaurants/[id]/addon-groups/[groupId]` — delete

### 7B. New Component: `AddonGroupForm.tsx`

**File:** `src/components/dashboard/restaurants/AddonGroupForm.tsx`

A modal/inline form for creating or editing a single addon group.

**Form fields:**
```
Group Name:          [___________________]
Display Name:        [___________________]  (optional, shown to customers)
Selection Type:      (•) Single   ( ) Multiple
Required:            [✓]
Min Selections:      [0]  (only for MULTIPLE)
Max Selections:      [5]  (only for MULTIPLE)

Options:
  ┌────────────────────────────────────────────┐
  │ Name              Price (+/-)   Default  X │
  │ [Small          ] [$0.00     ]  [ ]     🗑 │
  │ [Regular        ] [$0.00     ]  [✓]     🗑 │
  │ [Large          ] [$3.00     ]  [ ]     🗑 │
  │                        [+ Add Option]      │
  └────────────────────────────────────────────┘

[Cancel]  [Save]
```

### 7C. Update `MenuItemForm.tsx` — Addon Assignment

Add an **"Assign Addon Groups"** section to the existing menu item form. This shows checkboxes of all restaurant-level addon groups, and the vendor picks which ones apply to this item.

**Addition to MenuItemForm:**
```typescript
// Fetch restaurant's addon groups
const [availableGroups, setAvailableGroups] = useState<AddonGroup[]>([]);
const [assignedGroupIds, setAssignedGroupIds] = useState<string[]>([]);

// On save, POST to /api/restaurants/[id]/menu-items/[mid]/addons
// with { addonGroupIds: assignedGroupIds }
```

**UI (append after the Spicy Level dropdown):**
```
Addon Groups:
  [✓] Size (Required · Single)
  [✓] Spice Level (Optional · Single)
  [ ] Extra Toppings (Optional · Multiple)
  [✓] Drinks (Optional · Single)
```

---

## 8. Customer UI — Dynamic Addon Selection

### 8A. Replace hardcoded sections in `RestaurantDetails.tsx`

**Current hardcoded code to REMOVE:**
- Lines 219-223: `const availableToppings = [...]`
- Lines 225-238: `calculateTotalPrice()` with hardcoded size logic
- Lines 370-390: Hardcoded size buttons `["Small", "Regular", "Large (+ $3.00)"]`
- Lines 393-430: Hardcoded toppings list

**Replace with dynamic `AddonSelector` component.**

### 8B. New Component: `AddonSelector.tsx`

**File:** `src/components/menu/AddonSelector.tsx`

```typescript
interface AddonSelectorProps {
  addonGroups: MenuItemAddon[];          // from menuItem.addonGroups
  selectedAddons: SelectedAddon[];        // current selections
  onSelectionChange: (addons: SelectedAddon[]) => void;
  formatCurrency: (value: number) => string;
}
```

**Rendering logic:**
```typescript
{addonGroups.map(({ addonGroup }) => (
  <div key={addonGroup.id} className="mb-6">
    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-4">
      {addonGroup.displayName || addonGroup.name}
      {addonGroup.isRequired && <span className="text-red-500 text-sm ml-1">*Required</span>}
    </h3>

    {addonGroup.selectionType === 'SINGLE' ? (
      // Render radio-style buttons (like current size selector)
      <SingleSelectGroup group={addonGroup} ... />
    ) : (
      // Render checkbox-style list (like current toppings)
      <MultiSelectGroup group={addonGroup} ... />
    )}
  </div>
))}
```

### 8C. Updated `RestaurantDetails.tsx` State

Replace:
```typescript
const [selectedSize, setSelectedSize] = useState<string>("Small");
const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
```

With:
```typescript
const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
```

### 8D. Updated price calculation

Replace `calculateTotalPrice()`:
```typescript
const calculateTotalPrice = () => {
  if (!selectedMenuItem) return 0;
  const basePrice = selectedMenuItem.price;
  const addonsTotal = selectedAddons.reduce(
    (sum, addon) => sum + addon.priceAdjustment, 0
  );
  return (basePrice + addonsTotal) * quantity;
};
```

### 8E. Updated Add to Cart

```typescript
const handleAddToCartFromModal = () => {
  if (!selectedMenuItem) return;

  const addonsTotal = selectedAddons.reduce(
    (sum, a) => sum + a.priceAdjustment, 0
  );

  addItem({
    id: `${selectedMenuItem.id}-${Date.now()}`,   // unique per config
    menuItemId: selectedMenuItem.id,
    quantity,
    price: selectedMenuItem.price,
    name: selectedMenuItem.label,
    image: selectedMenuItem.image,
    restaurantName: initialData.name,
    restaurantId: initialData.id,
    selectedAddons,
    addonsTotal,
  });

  handleCloseModal();
};
```

### 8F. Fetching addons for menu items

Update `getRestaurant` server action to include addon data:

```typescript
// src/app/actions/restaurants.ts
const restaurant = await prisma.restaurant.findUnique({
  where: { id },
  include: {
    menuItems: {
      include: {
        addonGroups: {
          include: {
            addonGroup: {
              include: {
                options: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    },
  },
});
```

---

## 9. Cart & Order Integration

### 9A. Cart Store Updates (`useStore.ts`)

**Deduplication logic change:** Two cart items with the same `menuItemId` but different addon selections should be treated as **separate items**. Generate a unique key:

```typescript
const getCartItemKey = (menuItemId: string, selectedAddons?: SelectedAddon[]) => {
  if (!selectedAddons || selectedAddons.length === 0) return menuItemId;
  const addonKey = selectedAddons
    .map(a => a.optionId)
    .sort()
    .join('-');
  return `${menuItemId}__${addonKey}`;
};
```

Update `addItem` to compare by this composite key instead of just `menuItemId`.

### 9B. Cart Display

Update cart components to show selected addons under each item:

```
🍕 Margherita Pizza          $12.00
   Size: Large (+$3.00)
   Extra: Parmesan (+$1.50)
   × 2                       $33.00
```

### 9C. Order Creation

When creating an order, store the selected addons in `OrderItem.options`:

```typescript
// In the order creation API/action
const orderItems = cartItems.map(item => ({
  menuItemId: item.menuItemId,
  quantity: item.quantity,
  price: item.price + (item.addonsTotal || 0),  // Total per-unit price
  name: item.name,
  options: {
    selectedAddons: item.selectedAddons || [],    // Structured addon data
    addonsTotal: item.addonsTotal || 0,
  },
}));
```

This uses the existing `Json? options` field — **no schema change needed for OrderItem**.

### 9D. Order History / Receipt Display

When displaying past orders, parse `options.selectedAddons` to show what was selected:

```typescript
const addons = (orderItem.options as any)?.selectedAddons as SelectedAddon[] || [];
```

---

## 10. POS Integration

The POS system uses `POSOrderItem` which also has an `options: Json?` field. The same `selectedAddons` structure should be stored there.

### POS Item Customization Modal

Update the POS order item selection to show addon groups (same `AddonSelector` component) before adding to the POS order.

---

## 11. File-by-File Change List

### New Files to Create

| File | Purpose |
|---|---|
| `src/app/api/restaurants/[id]/addon-groups/route.ts` | GET/POST addon groups |
| `src/app/api/restaurants/[id]/addon-groups/[groupId]/route.ts` | PATCH/DELETE single group |
| `src/app/api/restaurants/[id]/menu-items/[mid]/addons/route.ts` | GET/POST addon assignments |
| `src/components/dashboard/restaurants/AddonGroupManager.tsx` | Vendor addon group list + CRUD |
| `src/components/dashboard/restaurants/AddonGroupForm.tsx` | Addon group create/edit form |
| `src/components/menu/AddonSelector.tsx` | Customer-facing dynamic addon picker |

### Existing Files to Modify

| File | Changes |
|---|---|
| `prisma/schema.prisma` | Add `AddonGroup`, `AddonOption`, `MenuItemAddon` models, `SelectionType` enum, relations on `MenuItem` and `Restaurant` |
| `src/types/index.ts` | Add `AddonGroup`, `AddonOption`, `MenuItemAddon`, `SelectedAddon`, `SelectionType` types. Add `addonGroups?` to `MenuItem` interface |
| `src/store/useStore.ts` | Add `selectedAddons` and `addonsTotal` to `CartItem`. Update `addItem` dedup logic to use composite key |
| `src/components/dashboard/restaurants/MenuItemForm.tsx` | Add addon group assignment checkboxes |
| `src/app/[locale]/restaurants/[id]/RestaurantDetails.tsx` | Remove hardcoded sizes/toppings. Replace with `AddonSelector`. Update `calculateTotalPrice`, `handleAddToCartFromModal`, state variables |
| `src/app/api/restaurants/[id]/menu-items/route.ts` | Update GET to include `addonGroups` relation |
| `src/app/actions/restaurants.ts` | Update `getRestaurant` to include addon data in menu items |

### Files That Stay Unchanged

| File | Why |
|---|---|
| `prisma/schema.prisma` — existing models | No fields removed. Only new relations added. `spicy` field stays. |
| `OrderItem` / `POSOrderItem` models | Already have `Json? options` — addon data stored there |
| All existing API routes (non-menu) | No impact |
| Driver, User, Address, Payment models | Untouched |

---

## Appendix: JSON Shape Stored in `OrderItem.options`

```json
{
  "selectedAddons": [
    {
      "groupId": "clxyz...",
      "groupName": "Size",
      "optionId": "clxyz...",
      "optionName": "Large",
      "priceAdjustment": 3.00
    },
    {
      "groupId": "clxyz...",
      "groupName": "Extra Toppings",
      "optionId": "clxyz...",
      "optionName": "Extra Parmesan Cheese",
      "priceAdjustment": 1.50
    }
  ],
  "addonsTotal": 4.50
}
```

This is **backward compatible** — existing orders with `options: null` or `options: {}` will continue to work without issues.
