# Supabase Realtime Setup Guide

## Enabling Realtime for Order Table

For Supabase Realtime to work, you need to enable it for the `Order` table in your Supabase dashboard.

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to your Supabase project dashboard
   - Go to **Database** → **Replication**

2. **Enable Realtime for Order Table**
   - Find the `Order` table in the list
   - Toggle the switch to enable Realtime replication
   - Make sure it's enabled for both INSERT and UPDATE events

### Alternative: Using SQL

If you prefer to enable it via SQL, run this command in the Supabase SQL Editor:

```sql
-- Enable Realtime for Order table
ALTER PUBLICATION supabase_realtime ADD TABLE "Order";
```

**Note:** The table name is case-sensitive. If your table is named differently (e.g., `order` in lowercase), adjust accordingly.

### Verify Realtime is Enabled

You can verify Realtime is enabled by checking:
1. In Supabase Dashboard → Database → Replication, the `Order` table should show as enabled
2. Check browser console for subscription status messages:
   - `✅ Successfully subscribed to...` means it's working
   - `❌ Error subscribing...` means there's an issue

### Troubleshooting

If Realtime is not working:

1. **Check Table Name Casing**
   - PostgreSQL table names are case-sensitive when quoted
   - If Prisma created the table as `"Order"`, use `"Order"` in the subscription
   - If it's `order` (lowercase), use `order`

2. **Check Realtime Status**
   - Go to Supabase Dashboard → Database → Replication
   - Ensure the `Order` table is enabled

3. **Check Browser Console**
   - Look for subscription status messages
   - Check for any error messages

4. **Verify Environment Variables**
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
   - The URL should be your Supabase project URL
   - The key should be the `anon` public key (not the service role key)

5. **Check Network Tab**
   - Open browser DevTools → Network tab
   - Look for WebSocket connections to `wss://[your-project].supabase.co/realtime/v1/websocket`
   - If you see connection errors, there might be a network/firewall issue

### Testing

To test if Realtime is working:

1. Open your app in the browser
2. Open browser console (F12)
3. Update an order status in the database (via Supabase dashboard or API)
4. You should see console logs like:
   - `📦 Order UPDATE event received: [order-id]`
   - `✅ Order belongs to current user, refetching orders...`
5. The UI should update automatically without refreshing

If you don't see these logs, Realtime is not receiving events, which means:
- Realtime is not enabled for the Order table, OR
- There's a connection issue

