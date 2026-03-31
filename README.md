# Food Delivery App 1.1.2 with Rider App + i8n Localization + fixes

A modern food delivery application built with Next.js, Supabase, Prisma, and Tailwind CSS.

## Features

- 🍔 Restaurant browsing and menu exploration
- 🛒 Cart management with real-time updates
- 👤 User authentication (Email, Google, GitHub)
- 📍 Address management for delivery
- 💳 Multiple payment methods
- 📱 Responsive design for all devices
- 🔄 Real-time updates using Supabase subscriptions

## Application Flow

1. **User Registration/Login**
   - Sign up with email/password
   - Social login options (Google, GitHub)
   - Address input for delivery

2. **Restaurant Selection**
   - Browse restaurants
   - View menus
   - Search and filter options

3. **Order Process**
   - Select items and quantities
   - Review order details
   - Add delivery address
   - Choose payment method
   - Confirm order

4. **Order Status**
   - Order placed confirmation
   - Real-time order tracking
   - Delivery status updates

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** Supabase Auth
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **State Management:** Zustand
- **UI Components:** Headless UI, radix-ui
- **Real-time Features:** Supabase Realtime

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
```

4. Set up Prisma:
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/                   # Next.js app directory
│   ├── auth/             # Authentication pages
│   ├── restaurants/      # Restaurant pages
│   ├── cart/            # Cart management
│   └── checkout/        # Checkout process
├── components/           # Reusable components
├── lib/                 # Utility functions
│   ├── supabase/       # Supabase client
│   └── prisma/         # Prisma client
├── prisma/             # Prisma schema and migrations
├── services/           # Business logic
├── store/             # Zustand store
└── types/             # TypeScript types
```

## Database Schema

The application uses Prisma as the ORM layer with the following main models:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  addresses Address[]
  orders    Order[]
}

model Restaurant {
  id          String   @id @default(cuid())
  name        String
  description String?
  image       String?
  menuItems   MenuItem[]
  orders      Order[]
}

model MenuItem {
  id           String     @id @default(cuid())
  name         String
  description  String?
  price        Decimal
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])
}

model Order {
  id           String     @id @default(cuid())
  userId       String
  restaurantId String
  status       String
  items        OrderItem[]
  user         User       @relation(fields: [userId], references: [id])
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
