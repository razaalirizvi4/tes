# API Documentation

## Overview

The food delivery platform provides a RESTful API built on Next.js API routes. All endpoints follow REST conventions and return JSON responses. The API supports multiple user roles with appropriate access control.

## Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### POST /api/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "data": {
    "access_token": "jwt_token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CUSTOMER",
      "approvalStatus": "APPROVED"
    }
  },
  "message": "Login successful!"
}
```

#### POST /api/signup
Create a new user account.

**Request Body (FormData):**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "1234567890",
  "role": "CUSTOMER",
  "businessName": "Optional for VENDOR",
  "vehicleType": "CAR",
  "documents": "File for DRIVER/VENDOR"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "CUSTOMER",
    "approvalRequired": false
  },
  "message": "Account created successfully!"
}
```

#### GET /api/google
Initiate Google OAuth login.

#### GET /api/facebook
Initiate Facebook OAuth login.

## User Management

#### GET /api/users
**Authentication Required:** Admin role

Retrieve all users with their profiles and order statistics.

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER",
    "totalSpent": 250.50,
    "orderStatuses": ["DELIVERED", "PENDING"],
    "addresses": [...],
    "vendorProfile": {...},
    "driver": {...}
  }
]
```

#### GET /api/users/{userId}
**Authentication Required:** User must own the account or be Admin

Retrieve specific user profile with addresses and role-specific data.

**Parameters:**
- `userId` (string): User ID

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "phoneNumber": "1234567890",
  "role": "CUSTOMER",
  "approvalStatus": "APPROVED",
  "addresses": [...],
  "vendorProfile": {...},
  "driver": {...}
}
```

#### PUT /api/users/{userId}
**Authentication Required:** User must own the account

Update user profile information.

**Request Body:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "phoneNumber": "1234567890",
  "email": "user@example.com"
}
```

### Address Management

#### GET /api/users/{userId}/addresses
**Authentication Required:** User must own the addresses

Retrieve all addresses for a user.

**Response:**
```json
[
  {
    "id": "uuid",
    "label": "Home",
    "streetAddress": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "phoneNumber": "1234567890",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "isDefault": true
  }
]
```

#### POST /api/users/{userId}/addresses
**Authentication Required:** User must own the addresses

Create a new address.

**Request Body:**
```json
{
  "label": "Home",
  "streetAddress": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "phoneNumber": "1234567890",
  "isDefault": true
}
```

#### DELETE /api/users/{userId}/addresses/{addressId}
**Authentication Required:** User must own the addresses

Delete an address.

**Request Body:**
```json
{
  "addressId": "uuid"
}
```

## Restaurant Management

#### GET /api/restaurants
Retrieve all restaurants with their menu items.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Pizza Palace",
    "chainName": "Pizza Palace",
    "address": "123 Food St",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "cuisineType": "Italian",
    "segment": "Casual Dining",
    "city": "New York",
    "area": "Manhattan",
    "rating": 4.5,
    "coverImage": "https://example.com/image.jpg",
    "deliveryTime": "30-45 min",
    "minimumOrder": "$15.00",
    "menuItems": [...]
  }
]
```

#### GET /api/restaurants/{id}
Retrieve specific restaurant with menu items.

**Parameters:**
- `id` (string): Restaurant ID

**Response:**
```json
{
  "restaurant": {
    "id": "uuid",
    "name": "Pizza Palace",
    "menuItems": [
      {
        "id": "uuid",
        "label": "Margherita Pizza",
        "description": "Classic tomato and cheese pizza",
        "price": 12.99,
        "image": "https://example.com/pizza.jpg",
        "category": "Pizza"
      }
    ]
  }
}
```

#### POST /api/restaurants
**Authentication Required:** Vendor role

Create a new restaurant.

**Request Body:**
```json
{
  "name": "Pizza Palace",
  "chainName": "Pizza Palace",
  "address": "123 Food St",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "cuisineType": "Italian",
  "segment": "Casual Dining",
  "city": "New York",
  "area": "Manhattan",
  "vendorId": "vendor-uuid"
}
```

#### PATCH /api/restaurants/{id}
**Authentication Required:** Vendor or Admin role

Update restaurant information.

**Request Body:**
```json
{
  "name": "Updated Pizza Palace",
  "rating": 4.8,
  "deliveryTime": "25-35 min"
}
```

#### DELETE /api/restaurants/{id}
**Authentication Required:** Vendor or Admin role

Delete a restaurant and all related data.

### Menu Item Management

#### GET /api/restaurants/{id}/menu-items
Retrieve all menu items for a restaurant.

#### POST /api/restaurants/{id}/menu-items
**Authentication Required:** Vendor role

Create a new menu item.

**Request Body:**
```json
{
  "label": "Margherita Pizza",
  "description": "Classic tomato and cheese pizza",
  "price": 12.99,
  "image": "https://example.com/pizza.jpg",
  "category": "Pizza"
}
```

#### PATCH /api/restaurants/{id}/menu-items
**Authentication Required:** Vendor role

Update a menu item.

#### DELETE /api/restaurants/{id}/menu-items
**Authentication Required:** Vendor role

Delete a menu item.

#### PATCH /api/restaurants/{id}/menu-items/{mid}
Update specific menu item.

#### DELETE /api/restaurants/{id}/menu-items/{mid}
Delete specific menu item.

## Order Management

#### GET /api/orders
**Authentication Required:** Customer role or Admin

Retrieve orders. Admin sees all orders, customers see only their own.

**Query Parameters:**
- `userId` (string): Filter orders by user ID (Admin only)

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "restaurantId": "uuid",
    "status": "PENDING",
    "totalAmount": 25.99,
    "deliveryAddress": "123 Main St, New York, NY 10001",
    "specialInstructions": "Leave at door",
    "paymentMethod": "cod",
    "orderItems": [
      {
        "id": "uuid",
        "menuItemId": "uuid",
        "quantity": 2,
        "price": 12.99,
        "name": "Margherita Pizza",
        "options": {
          "size": "large",
          "toppings": ["extra cheese"]
        }
      }
    ],
    "user": {...},
    "restaurant": {...}
  }
]
```

#### POST /api/orders
**Authentication Required:** Customer role

Create a new order.

**Request Body:**
```json
{
  "userId": "uuid",
  "restaurantId": "uuid",
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 2,
      "price": 12.99,
      "name": "Margherita Pizza",
      "options": {
        "size": "large"
      }
    }
  ],
  "totalAmount": 25.99,
  "selectedAddress": "123 Main St, New York, NY 10001",
  "specialInstructions": "Leave at door",
  "paymentMethod": "cod",
  "phoneNumber": "1234567890"
}
```

#### GET /api/orders/{orderId}
**Authentication Required:** Order owner, assigned driver, restaurant owner, or Admin

Retrieve specific order details.

**Parameters:**
- `orderId` (string): Order ID

#### PATCH /api/orders
**Authentication Required:** Driver or Admin role

Update order status.

**Request Body:**
```json
{
  "orderId": "uuid",
  "status": "DELIVERED"
}
```

### Order Assignment

#### POST /api/orders/{orderId}/assign
**Authentication Required:** Admin role

Assign a driver to an order.

**Request Body:**
```json
{
  "driverId": "uuid"
}
```

#### DELETE /api/orders/{orderId}/assign
**Authentication Required:** Admin role

Unassign a driver from an order.

## Driver Management

#### GET /api/drivers
**Authentication Required:** Admin role

Retrieve all drivers with their current status and statistics.

#### GET /api/drivers/{driverId}
**Authentication Required:** Driver owner or Admin

Retrieve specific driver details.

#### GET /api/drivers/{driverId}/location
**Authentication Required:** Driver owner or Admin

Get driver's current location.

#### POST /api/drivers/{driverId}/location
**Authentication Required:** Driver owner

Update driver's current location.

**Request Body:**
```json
{
  "lat": 40.7128,
  "lng": -74.0060
}
```

## Location Services

#### GET /api/locations
**Authentication Required**

Retrieve available cities and areas.

**Response:**
```json
{
  "New York": ["Manhattan", "Brooklyn", "Queens"],
  "Los Angeles": ["Hollywood", "Beverly Hills", "Santa Monica"]
}
```

## Callback Handling

#### GET /api/callback
Handle OAuth callback from external providers.

#### GET /api/auth/callback
Handle authentication callback for OAuth flows.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created successfully
- `400` - Bad request (missing or invalid data)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Internal server error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute per IP
- General API endpoints: 100 requests per minute per user
- Location updates: 10 requests per minute per driver

## Data Validation

All endpoints validate input data:
- Required fields must be present
- Email addresses must be valid format
- Phone numbers must match expected pattern
- IDs must be valid UUIDs
- Geographic coordinates must be within valid ranges

## Real-time Updates

The system supports real-time updates via WebSocket connections for:
- Order status changes
- Driver location updates
- New order notifications

---

*Last updated: October 2025*