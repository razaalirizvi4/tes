
---

### **Fiestaa Food Delivery Requirements**  

**Date**: 26 Dec 2024  
**Client**: Fiestaa Product Owner  

---

### **Project Overview**  
- **Objective**: Connect customers and vendors on a single platform for food ordering and delivery.  
- **Roles**:
  - **Customer** (iOS/Android/Web): Browse vendor items, place orders, track delivery.
  - **Driver** (iOS/Android): Receive, accept, and fulfill delivery requests.
  - **Vendor** (Web/iOS/Android): Manage listings, accept orders.
  - **Admin** (Dispatcher Panel - Web): Oversee drivers, allocate tasks, optimize routes.
  - **Super Admin** (Web): Platform owner, manages users, transactions, and content.

- **Existing Solution**: Adapted from ABC Technologies, includes custom branding (color scheme), no changes to design or workflow.

---

### **Solution Workflow**  
1. **Browsing & Selection**  
   - Customer opens platform, browses vendor menus, selects items, customizes, adds to cart.  

2. **Checkout**  
   - Customer reviews order, inputs delivery details, selects payment method (credit, digital wallet, COD), confirms order.  

3. **Order Routing**  
   - Vendor receives real-time notification; prepares and updates order status for tracking.

4. **Delivery Partner Assignment**  
   - System auto-assigns a nearby driver based on location/availability; notifies driver upon order readiness.

5. **Order Pickup**  
   - Driver picks up order, customer receives real-time updates on status.

6. **Delivery**  
   - Driver transports order, live-tracked by customer, completes handover.

7. **Completion & Feedback**  
   - Customer rates experience; system finalizes payment settlement and records order completion.

---

### **Core Features**  

- **Customer App**  
   - **Product Browsing**: Restaurant categories, notifications, dine-in booking.
   - **Cart**: Add/edit/clear items, one-click reorder, persistent cart.
   - **Order History**: View past orders.
   - **Checkout**: Shipping address, location selection.
   - **Payment**: Credit cards, digital wallets, COD.
   - **Delivery Tracking**: Estimated arrival, real-time map tracking, driver info.
   - **Chat**: Real-time, multimedia support.
   - **Localization**: Multi-language, RTL layout.
   - **UI Modes**: Dark mode.
   - **Geolocation**: Map SDK (Google Maps/MapBox).
   - **Ratings & Reviews**: Feedback for vendors/drivers.
   - **Search**: Restaurant and dish search.
   - **Profile**: Manage account settings.
   - **Login/Registration**: Facebook, email/password, SMS OTP, persistent login.

- **Driver App**  
   - **Availability Toggle**: Go online/offline.
   - **Order Management**: Accept/reject orders, view directions.
   - **History**: View completed deliveries.
   - **Notifications**: Order updates.
   - **Chat**: Real-time, multimedia support with customers.
   - **Profile**: Manage details.
   - **Login/Registration**: Facebook, email/password, SMS OTP, persistent login.

- **Vendor Admin** (Web, iOS, Android)  
   - **Order Management**: Accept/reject, view order history.
   - **Notifications**: New orders.
   - **Product Management**: Add/edit/delete items.
   - **Profile**: Manage account settings.
   - **Login/Registration**: Facebook, email/password, SMS OTP, persistent login.

- **Web Admin Panel**  
   - **User/Order Management**: Track users and orders.
   - **Coupons**: Create/manage promotional offers.
   - **Driver Management**: Track/manage drivers.
   - **Payment Management**: Handle payments and restaurant payouts.
   - **Settings**: Configure notifications, social logins, currencies.

---

### **Technical Solution**  

#### **Backend**
   - **Supabase** as backend for data synchronization, authentication, and storage.
   - **Security Rules**: Role-based access controls for all user roles, implemented in `src/middleware.ts`. The protected routes and their required roles are as follows:
     - **Customer routes**: `/profile`, `/orders` (Roles: CUSTOMER, VENDOR, DRIVER, ADMIN, SUPER_ADMIN)
     - **Vendor routes**: `/dashboard/restaurants`, `/dashboard/menu` (Roles: VENDOR, ADMIN, SUPER_ADMIN)
     - **Driver routes**: `/dashboard/deliveries`, `/dashboard/earnings` (Roles: DRIVER, ADMIN, SUPER_ADMIN)
     - **Admin routes**: `/dashboard/users`, `/dashboard/drivers`, `/dashboard/dispatch` (Roles: ADMIN, SUPER_ADMIN)
     - **Super Admin routes**: `/dashboard/settings`, `/dashboard/analytics` (Roles: SUPER_ADMIN)
   - **Real-Time Updates**: Enabled for order tracking, driver location, and chat.
   - **Offline Sync**: Core features, e.g., order status updates, persist in low connectivity.

#### **Geolocation**  
   - SDK Choice: Developer can choose **Google Maps** or **Mapbox** based on budget and performance needs.
   - **Driver Tracking**: Real-time tracking with route optimization.

#### **Authentication**  
   - **Supabase Auth** with multi-login options: Facebook, SMS, email/password.
   - **Session Management**: Persistent login for user convenience.

#### **Payments**  
   - **Gateway**: Stripe for card/digital payments; COD support.
   - **Settlement**: Supabase tracks order status and payouts.

#### **Notifications and Chat**  
   - **Push Notifications**: Supabase Cloud Messaging for updates.
   - **Chat**: Firestore supports real-time messaging, with multimedia via Supabase Storage.

#### **Localization**  
   - **Multi-language**: Supabase collection for language preferences, RTL layout support.

#### **Admin and Reporting**  
   - **Admin Panels**: Dispatcher for delivery allocation; Super Admin for user metrics, reports.
   - **Analytics**: Supabase Analytics for usage data, Crashlytics for error monitoring.

---

This streamlined spec provides developers with essential guidance, flexible SDK choices, and a Supabase-driven backend to meet Fiestaa’s needs efficiently and securely.