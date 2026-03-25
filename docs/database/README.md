# Database Schema Documentation

## Overview

The food delivery platform uses PostgreSQL as the primary database with Prisma ORM for type-safe database operations. The schema is designed to support a multi-role food delivery ecosystem with customers, drivers, vendors, and administrators.

## Database Schema Diagram

```mermaid
erDiagram
    USER ||--o{ ADDRESS : has
    USER ||--o{ ORDER : places
    USER ||--o| DRIVER : becomes
    USER ||--o| VENDOR_PROFILE : has
    USER {
        string id PK
        string email UK
        string name
        string phoneNumber UK
        datetime dob
        enum role
        enum approvalStatus
        string provider
        datetime createdAt
        datetime updatedAt
    }
    
    VENDOR_PROFILE ||--o{ RESTAURANT : owns
    VENDOR_PROFILE {
        string id PK
        string userId FK
        string businessName
        json documents
        datetime approvedAt
        datetime createdAt
        datetime updatedAt
    }
    
    ADDRESS {
        string id PK
        string userId FK
        string label
        string streetAddress
        string city
        string state
        string zipCode
        string phoneNumber
        float latitude
        float longitude
        boolean isDefault
        datetime createdAt
        datetime updatedAt
    }
    
    RESTAURANT ||--o{ MENU_ITEM : contains
    RESTAURANT ||--o{ ORDER : receives
    RESTAURANT {
        string id PK
        string name
        string chainName
        string address
        float latitude
        float longitude
        string cuisineType
        string segment
        string city
        string area
        float rating
        string coverImage
        string deliveryTime
        string minimumOrder
        datetime spottedDate
        datetime closedDate
        string vendorId FK
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    MENU_ITEM ||--o{ ORDER_ITEM : includes
    MENU_ITEM {
        string id PK
        string label
        string description
        float price
        string image
        string category
        string restaurantId FK
        datetime createdAt
        datetime updatedAt
    }
    
    DRIVER ||--o{ DRIVER_LOCATION : has
    DRIVER ||--o{ DRIVER_STATS : has
    DRIVER ||--o{ ORDER : delivers
    DRIVER {
        string id PK
        string userId FK UK
        string status
        float currentLat
        float currentLng
        datetime lastLocation
        string activeOrderId FK UK
        string vehicleType
        json documents
        float rating
        int totalOrders
        datetime createdAt
        datetime updatedAt
    }
    
    DRIVER_LOCATION {
        string id PK
        string driverId FK
        float lat
        float lng
        datetime timestamp
    }
    
    DRIVER_STATS {
        string id PK
        string driverId FK UK
        int totalDeliveries
        float totalEarnings
        float averageRating
        float completionRate
        datetime lastPayout
        datetime createdAt
        datetime updatedAt
    }
    
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER {
        string id PK
        string userId FK
        string restaurantId FK
        string status
        string specialInstructions
        string paymentMethod
        float totalAmount
        string deliveryAddress
        string driverId FK
        string activeOrderId FK
        float pickupLat
        float pickupLng
        float dropoffLat
        float dropoffLng
        string phoneNumber
        datetime assignedAt
        datetime pickedUpAt
        datetime deliveredAt
        int estimatedTime
        int actualTime
        int driverRating
        datetime createdAt
        datetime updatedAt
    }
    
    ORDER_ITEM {
        string id PK
        string orderId FK
        string menuItemId FK
        int quantity
        json options
        float price
        string name
        datetime createdAt
        datetime updatedAt
    }
```

## Entity Relationships

### Core Relationships

1. **User → Address** (One-to-Many)
   - A user can have multiple addresses
   - Used for delivery locations

2. **User → Order** (One-to-Many)
   - A user can place multiple orders
   - Track order history

3. **User → Driver** (One-to-One)
   - Users can become drivers
   - Extended driver functionality

4. **User → VendorProfile** (One-to-One)
   - Users can become vendors
   - Business profile management

5. **VendorProfile → Restaurant** (One-to-Many)
   - Vendors can own multiple restaurants
   - Business expansion support

6. **Restaurant → MenuItem** (One-to-Many)
   - Restaurants have multiple menu items
   - Menu management

7. **Restaurant → Order** (One-to-Many)
   - Orders are placed to specific restaurants
   - Order routing

8. **Order → OrderItem** (One-to-Many)
   - Orders contain multiple items
   - Order details

9. **Driver → Order** (One-to-Many)
   - Drivers can have multiple orders
   - Delivery tracking

10. **Driver → DriverLocation** (One-to-Many)
    - Real-time location tracking
    - Location history

## Database Tables

### Users Table
Primary user table supporting multiple roles:
- **CUSTOMER**: Can place orders and track deliveries
- **DRIVER**: Can deliver orders and update status
- **VENDOR**: Can manage restaurants and menu items
- **ADMIN**: System administration privileges
- **SUPER_ADMIN**: Full system access

```sql
CREATE TABLE "User" (
    id             String         @id @default(uuid())
    email          String         @unique
    name           String?
    phoneNumber    String?        @unique
    dob            DateTime?
    role           UserRole       @default(CUSTOMER)
    approvalStatus ApprovalStatus? -- For DRIVER and VENDOR roles
    provider       String         @default("email")  -- 'google' or 'email'
    createdAt      DateTime       @default(now())
    updatedAt      DateTime       @updatedAt
)
```

### Addresses Table
User delivery addresses with geolocation:
```sql
CREATE TABLE "Address" (
    id            String    @id @default(cuid())
    userId        String
    label         String    @default("Home")
    streetAddress String
    city          String
    state         String
    zipCode       String
    phoneNumber   String
    latitude      Float?
    longitude     Float?
    isDefault     Boolean   @default(false)
    user          User      @relation(fields: [userId], references: [id])
    createdAt     DateTime  @default(now())
    updatedAt     DateTime  @updatedAt

    @@index([userId])
)
```

### Restaurants Table
Restaurant information with location data:
```sql
CREATE TABLE "Restaurant" (
    id           String        @id @default(cuid())
    name         String
    chainName    String
    address      String
    latitude     Float
    longitude    Float
    cuisineType  String
    segment      String
    city         String
    area         String
    rating       Float?
    coverImage   String?
    deliveryTime String?
    minimumOrder String?
    spottedDate  DateTime?
    closedDate   DateTime?
    menuItems    MenuItem[]
    orders       Order[]
    vendorId     String
    vendor       VendorProfile @relation(fields: [vendorId], references: [id])
    isActive     Boolean       @default(true)
    createdAt    DateTime      @default(now())
    updatedAt    DateTime      @updatedAt

    @@index([vendorId])
)
```

### Orders Table
Order management with delivery tracking:
```sql
CREATE TABLE "Order" (
    id              String      @id @default(uuid())
    userId          String
    user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
    restaurantId    String
    restaurant      Restaurant  @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
    status          String      @default("PENDING")
    specialInstructions String?
    paymentMethod    String       @default("cod")
    totalAmount     Float
    deliveryAddress String
    orderItems      OrderItem[]
    driverId        String?
    driver          Driver?     @relation("DriverOrders", fields: [driverId], references: [id])
    assignedDriver  Driver?     @relation("ActiveDelivery")
    pickupLat       Float?
    pickupLng       Float?
    dropoffLat      Float?
    dropoffLng      Float?
    phoneNumber     String?
    assignedAt      DateTime?
    pickedUpAt      DateTime?
    deliveredAt     DateTime?
    estimatedTime   Int?
    actualTime      Int?
    driverRating    Int?
    createdAt       DateTime    @default(now())
    updatedAt       DateTime    @updatedAt
)
```

### Drivers Table
Driver management with location tracking:
```sql
CREATE TABLE "Driver" (
    id            String           @id @default(cuid())
    userId        String           @unique
    user          User             @relation(fields: [userId], references: [id])
    status        String           @default("OFFLINE")
    currentLat    Float?
    currentLng    Float?
    lastLocation  DateTime?
    activeOrder   Order?           @relation("ActiveDelivery", fields: [activeOrderId], references: [id])
    activeOrderId String?         @unique
    orders        Order[]          @relation("DriverOrders")
    locations     DriverLocation[]
    stats         DriverStats?
    rating        Float?
    totalOrders   Int              @default(0)
    vehicleType   String
    documents     Json?
    createdAt     DateTime         @default(now())
    updatedAt     DateTime         @updatedAt
)
```

## Indexes and Performance

### Critical Indexes
```sql
-- User indexes
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_user_approval_status ON "User"(approvalStatus);

-- Address indexes
CREATE INDEX idx_address_user_id ON "Address"(userId);

-- Restaurant indexes
CREATE INDEX idx_restaurant_vendor_id ON "Restaurant"(vendorId);
CREATE INDEX idx_restaurant_location ON "Restaurant"(latitude, longitude);
CREATE INDEX idx_restaurant_city_area ON "Restaurant"(city, area);
CREATE INDEX idx_restaurant_cuisine_type ON "Restaurant"(cuisineType);

-- Order indexes
CREATE INDEX idx_order_user_id ON "Order"(userId);
CREATE INDEX idx_order_restaurant_id ON "Order"(restaurantId);
CREATE INDEX idx_order_status ON "Order"(status);
CREATE INDEX idx_order_driver_id ON "Order"(driverId);
CREATE INDEX idx_order_created_at ON "Order"(createdAt);

-- Driver indexes
CREATE INDEX idx_driver_user_id ON "Driver"(userId);
CREATE INDEX idx_driver_status ON "Driver"(status);
CREATE INDEX idx_driver_location ON "Driver"(currentLat, currentLng);
CREATE INDEX idx_driver_location_timestamp ON "DriverLocation"(driverId, timestamp);
```

## Enums

### UserRole Enum
```sql
enum UserRole {
  CUSTOMER
  DRIVER
  VENDOR
  ADMIN
  SUPER_ADMIN
}
```

### ApprovalStatus Enum
```sql
enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}
```

## Data Integrity Constraints

### Foreign Key Constraints
- All relationships are enforced with foreign key constraints
- Cascade delete where appropriate (Orders, Address)
- Restrict delete where business logic requires (User, Restaurant)

### Check Constraints
- Status validation for orders and drivers
- Rating ranges (1-5)
- Positive values for prices and quantities

### Unique Constraints
- Email addresses must be unique
- Phone numbers must be unique
- Driver active order relationships

## Migration History

The database has evolved through multiple migrations:
1. **Initial schema** - Core user and restaurant models
2. **Role-based access** - Multi-role user system
3. **Driver management** - Location tracking and delivery
4. **Order enhancements** - Payment methods and status tracking
5. **Performance optimization** - Indexes and constraints

## Backup and Recovery

### Backup Strategy
- Daily automated backups
- Point-in-time recovery capability
- Cross-region backup replication

### Data Retention
- User data: Until account deletion
- Order data: 7 years for compliance
- Location data: 30 days for privacy
- Analytics data: Aggregated retention

## Security Considerations

### Data Encryption
- All sensitive data encrypted at rest
- TLS encryption for data in transit
- Secure key management

### Access Control
- Role-based database access
- Principle of least privilege
- Regular access audits

### Privacy Compliance
- User data anonymization options
- Right to be forgotten implementation
- GDPR compliance measures

---

*Last updated: October 2025*