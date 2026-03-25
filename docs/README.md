# Food Delivery Platform Documentation

## Overview

This comprehensive documentation covers the food delivery platform built with Next.js, Supabase, and PostgreSQL. The platform supports multiple user roles (Customer, Driver, Vendor, Admin) and provides a complete food delivery ecosystem.

## Documentation Structure

- **[Getting Started](./getting-started/README.md)** - Quick setup and installation guide
- **[Architecture](./architecture/README.md)** - System architecture and technology stack
- **[Database](./database/README.md)** - Database schema and relationships
- **[API Documentation](./api/README.md)** - Complete API endpoint documentation
- **[User Flows](./user-flows/README.md)** - User journey diagrams and flows
- **[User Guides](./user-guides/README.md)** - Role-specific user manuals
- **[Currency Management Guide](./currency-management-guide.md)** - Currency system architecture and best practices
- **[Components](./components/README.md)** - React component documentation
- **[Services](./services/README.md)** - Business logic and service layers
- **[Deployment](./deployment/README.md)** - Deployment and DevOps guide
- **[Security](./security/README.md)** - Authentication and security documentation
- **[Troubleshooting](./troubleshooting/README.md)** - Common issues and solutions

## Quick Navigation

### For Different User Types

- **Customers**: [Customer User Guide](./user-guides/customer-guide.md)
- **Drivers**: [Driver User Guide](./user-guides/driver-guide.md)
- **Vendors**: [Vendor User Guide](./user-guides/vendor-guide.md)
- **Administrators**: [Admin User Guide](./user-guides/admin-guide.md)

### For Developers

- **[Development Setup](./getting-started/development-setup.md)**
- **[API Reference](./api/README.md)**
- **[Database Schema](./database/schema.md)**
- **[Component Library](./components/README.md)**

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Real-time**: Socket.io
- **Maps**: Google Maps API
- **Payment**: Stripe integration
- **Charts**: Chart.js, Recharts

## Key Features

### Multi-Role System
- **Customers**: Browse restaurants, place orders, track deliveries
- **Drivers**: Manage deliveries, update location, earn tracking
- **Vendors**: Manage restaurants, menu items, orders
- **Admins**: System oversight, user management, analytics

### Core Functionality
- Restaurant discovery and filtering
- Real-time order tracking
- Location-based services
- Payment processing
- Driver assignment and dispatch
- Analytics and reporting

## Getting Started

1. **Read the [Getting Started Guide](./getting-started/README.md)**
2. **Review the [Architecture Overview](./architecture/README.md)**
3. **Set up your [Development Environment](./getting-started/development-setup.md)**
4. **Explore the [API Documentation](./api/README.md)**

## Support

- **Issues**: Report bugs and feature requests
- **Documentation**: This comprehensive guide
- **Community**: Developer discussions and best practices

---

*Last updated: October 2024*
*Version: 1.0.0*