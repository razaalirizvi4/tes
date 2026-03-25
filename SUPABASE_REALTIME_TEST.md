# Supabase Realtime Testing Instructions

This document provides instructions for testing the Supabase Realtime functionality for new orders.

## Prerequisites

1. **Enable Realtime on the `Order` table in Supabase Dashboard:**

   - Go to your Supabase Dashboard
   - Navigate to Database → Replication
   - Find the `Order` table (note: capital O)
   - Enable replication for the `Order` table
   - This is required for Realtime subscriptions to work

2. **Environment Variables:**
   Ensure your `.env.local` file has:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Testing with Real Customer Orders

### Recommended Testing Method

1. **Open the Orders Dashboard:**

   - Navigate to `/dashboard/orders` in your browser (as a vendor/admin)
   - Open the browser console (F12) to see realtime logs

2. **Create an Order from Customer Account:**

   - Log in as a customer account
   - Browse restaurants and add items to cart
   - Complete the checkout process to place a new order
   - The order will be created in the database and trigger the Realtime subscription

3. **Watch for Real-time Updates:**
   - The new order should appear immediately in the orders dashboard
   - Check the browser console for realtime event logs
   - No page refresh needed!

## What to Expect

1. **Open the Orders Dashboard:**

   - Navigate to `/dashboard/orders` in your browser
   - Open the browser console (F12)

2. **Expected Console Logs:**

   ```
   🔌 Initializing Supabase Realtime subscription...
   ✅ Successfully subscribed to Order table INSERT events
   📦 New order INSERT event received: [order_id]
   📦 Order data: { ... }
   ✅ Full order details fetched: [order_id]
   ✅ Adding new order to UI: [order_id]
   ```

3. **UI Behavior:**
   - The new order should appear at the top of the orders list (if you're on page 1)
   - The total orders count should increment
   - The order should appear immediately without page refresh

## Troubleshooting

### Issue: No realtime events received

**Solution:**

1. Check that Realtime is enabled for the `Order` table in Supabase Dashboard
2. Verify your Supabase URL and Anon Key are correct
3. Check browser console for subscription errors
4. Ensure you're logged in and have the correct permissions

### Issue: "Failed to fetch full order details"

**Solution:**

1. Check that the API endpoint `/api/orders?orderId=...` is working
2. Verify the order was created successfully in the database
3. Check network tab in browser DevTools for API errors

### Issue: Order appears but not in scope

**Solution:**

1. Verify the order's restaurant belongs to the current vendor (if not super admin)
2. Check the `orderBelongsToScope` function logic
3. Ensure the order's `restaurant.vendorId` matches the current user's vendor ID

## Notes

- Realtime subscriptions only work for INSERT events (new orders)
- The subscription automatically filters orders based on user scope (vendor/admin)
- Orders are only added to the UI if you're on page 1
- Duplicate orders are prevented by checking if the order ID already exists in the list
