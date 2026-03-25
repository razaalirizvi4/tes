# Customer User Guide

## Welcome to Food Delivery Platform

This guide will help you navigate and use all features available to customers on our food delivery platform.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Account Management](#account-management)
3. [Ordering Food](#ordering-food)
4. [Order Tracking](#order-tracking)
5. [Profile Management](#profile-management)
6. [Addresses](#addresses)
7. [Order History](#order-history)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Creating an Account

1. **Visit the Registration Page**
   - Go to `/auth/signup`
   - Click "Sign Up" from the homepage

2. **Fill Registration Form**
   ```
   Email: your.email@example.com
   Password: (minimum 8 characters)
   Full Name: Your full name
   Phone Number: (10-digit number)
   Role: Select "Customer"
   ```

3. **Email Verification**
   - Check your email for verification link
   - Click the link to activate your account
   - You can now log in

### Logging In

1. **Go to Login Page**
   - Navigate to `/auth/login`
   - Enter your email and password
   - Click "Login"

2. **Alternative Login Methods**
   - Click "Login with Google" for Google OAuth
   - Click "Login with Facebook" for Facebook OAuth

## Account Management

### Viewing Your Profile
- Navigate to `/profile` to view your account details
- See your personal information, role, and account status

### Updating Personal Information
1. Go to `/profile`
2. Click "Edit Profile"
3. Update any of the following:
   - Full name
   - Phone number
   - Email address
4. Click "Save Changes"

### Account Security
- Use a strong password (minimum 8 characters)
- Enable two-factor authentication (if available)
- Log out after using public computers
- Regularly update your password

## Ordering Food

### Browsing Restaurants

1. **Homepage Navigation**
   - Visit the homepage `/`
   - Browse featured restaurants
   - View top-rated and trending options

2. **Restaurant Listing Page**
   - Go to `/restaurants`
   - Use search bar to find specific restaurants
   - Apply filters:
     - Cuisine type (Italian, Chinese, Mexican, etc.)
     - Price range
     - Rating
     - Delivery time
     - Distance

3. **Restaurant Details**
   - Click on any restaurant card
   - View restaurant information:
     - Name and description
     - Address and hours
     - Rating and reviews
     - Delivery area and time
     - Minimum order amount

### Adding Items to Cart

1. **Browse Menu**
   - Once in restaurant details, view the menu
   - Items are organized by categories
   - Each item shows:
     - Name and description
     - Price
     - Image (if available)
     - Preparation time

2. **Customize Items**
   - Click on menu item to customize
   - Select options:
     - Size variations
     - Add-ons and extras
     - Special instructions
     - Quantity

3. **Add to Cart**
   - Click "Add to Cart" button
   - Confirm quantity and options
   - Item appears in cart sidebar

### Cart Management

1. **View Cart**
   - Cart icon in header shows item count
   - Click to open cart sidebar
   - View all added items and totals

2. **Cart Actions**
   - **Update Quantity**: Use +/- buttons
   - **Remove Items**: Click remove button
   - **Apply Promo Codes**: Enter code in promotion field
   - **View Delivery Info**: Check delivery fee and time

3. **Clear Cart**
   - Click "Clear Cart" to remove all items
   - Note: Adding items from another restaurant will automatically clear your cart

## Order Tracking

### Placing an Order

1. **Proceed to Checkout**
   - Review cart items and totals
   - Click "Proceed to Checkout"

2. **Delivery Information**
   - **Select Address**: Choose from saved addresses or add new one
   - **Delivery Instructions**: Add special notes for driver
   - **Phone Number**: Provide contact number for delivery updates

3. **Payment Method**
   - **Cash on Delivery**: Pay driver directly
   - **Credit/Debit Card**: Use saved card or add new one
   - **Digital Wallet**: Use integrated payment methods

4. **Place Order**
   - Review all details
   - Click "Place Order"
   - Receive order confirmation

### Tracking Your Order

1. **Order Confirmation**
   - Get immediate confirmation page
   - Order number and estimated time
   - Option to track order

2. **Real-time Updates**
   - Navigate to `/tracking/{orderId}`
   - See live status updates:
     ```
     PENDING → CONFIRMED → PREPARING → PICKED UP → OUT FOR DELIVERY → DELIVERED
     ```

3. **Driver Tracking**
   - See driver's location on map
   - Get estimated arrival time
   - Receive push notifications
   - SMS updates (if enabled)

4. **Contact Support**
   - Use in-app chat for immediate assistance
   - Call support hotline from tracking page
   - Report issues with specific order

## Profile Management

### Viewing Orders
1. Go to `/profile`
2. Click "My Orders" tab
3. View order history with:
   - Order date and time
   - Restaurant name
   - Items ordered
   - Total amount
   - Status

### Reordering
1. In order history, click "Reorder" button
2. Items added to cart automatically
3. Modify quantities or items as needed
4. Proceed with checkout

### Rating Orders
- Rate restaurants and drivers after delivery
- Leave detailed feedback
- Help other customers make informed decisions

## Addresses

### Managing Delivery Addresses

1. **View Addresses**
   - Go to `/profile/addresses`
   - See all saved addresses
   - Default address is highlighted

2. **Add New Address**
   - Click "Add New Address"
   - Fill address form:
     ```
     Label: (Home, Office, etc.)
     Street Address: Complete address
     City: Your city
     State: Your state
     ZIP Code: Postal code
     Phone Number: Contact number
     Set as Default: Check if this is your main address
     ```
   - Click "Save Address"

3. **Edit Address**
   - Click "Edit" next to address
   - Modify any details
   - Click "Update Address"

4. **Delete Address**
   - Click "Delete" next to address
   - Confirm deletion
   - Note: Cannot delete default address without setting another as default

## Order History

### Viewing Past Orders

1. **Access Order History**
   - Go to `/profile`
   - Click "Orders" tab
   - Browse chronological order list

2. **Order Details**
   - Click any order to view full details
   - See complete item breakdown
   - View delivery information
   - Check payment status

### Reordering and Favorites

1. **Quick Reorder**
   - Click "Reorder" on any past order
   - Items automatically added to cart
   - Same restaurant and items as previous order

2. **Favorite Restaurants**
   - Heart icon on restaurant cards
   - View favorites in separate section
   - Quick access to frequently ordered places

## Troubleshooting

### Common Issues

#### Login Problems
- **"Invalid email or password"**
  - Double-check email and password
  - Use password reset if needed
  - Clear browser cache

- **"Account not found"**
  - Verify email address is correct
  - Check if account was created
  - Try alternative login methods

#### Ordering Issues
- **"Restaurant not delivering to your area"**
  - Check if address is within delivery zone
  - Try adding a different address
  - Contact restaurant directly

- **"Item out of stock"**
  - Choose alternative items
  - Wait for restock
  - Contact restaurant for availability

- **"Payment failed"**
  - Check card details and expiration
  - Try different payment method
  - Contact bank if issue persists

#### Order Tracking Issues
- **"Order status not updating"**
  - Refresh the page
  - Check internet connection
  - Contact support for assistance

- **"Driver not responding"**
  - Use in-app chat feature
  - Call driver directly (if number provided)
  - Contact customer support

### Getting Help

#### Customer Support
- **In-App Chat**: Available 24/7
- **Phone Support**: (800) 123-4567
- **Email Support**: support@fooddelivery.com
- **Help Center**: Visit `/help` for FAQ

#### Emergency Contact
- For delivery emergencies, use the emergency button in order tracking
- Contact local authorities if needed
- Report safety concerns immediately

### Tips for Best Experience

1. **Keep Information Updated**
   - Maintain current contact information
   - Keep delivery addresses accurate
   - Update payment methods regularly

2. **Optimize for Delivery**
   - Provide clear delivery instructions
   - Be available during estimated delivery time
   - Keep phone charged and accessible

3. **Be Considerate**
   - Rate orders to help improve service
   - Provide helpful feedback
   - Treat delivery drivers with respect

4. **Stay Informed**
   - Enable push notifications
   - Check order status regularly
   - Keep track of order confirmations

---

## Frequently Asked Questions

**Q: How do I cancel an order?**
A: Contact customer support immediately. Cancellation may not be possible once preparation has started.

**Q: Can I modify an order after placing it?**
A: Contact the restaurant directly. Changes may be possible depending on preparation status.

**Q: What if my order is wrong or missing items?**
A: Contact customer support with your order number. We'll arrange for missing items or provide a refund.

**Q: How do I report a problem with my order?**
A: Use the "Report Issue" button in order tracking or contact customer support directly.

**Q: Can I schedule an order for later?**
A: Currently, all orders are for immediate delivery. Check back for future scheduling options.

---

*Last updated: October 2025*