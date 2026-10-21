# ShopSphere — AI-Powered Multi-Vendor E-Commerce Platform

ShopSphere is a modern multi-vendor e-commerce platform designed to provide a seamless online shopping experience for customers while enabling sellers to manage products, inventory, and orders. The platform also includes administrative functionality and an AI-powered shopping assistant.

This repository contains the **ShopSphere frontend**, built with Next.js, React, TypeScript, and Tailwind CSS. It communicates with the backend API to support authentication, product discovery, shopping cart management, checkout, orders, and other e-commerce features.

## Key Features

### Customer Experience
- Browse and search products.
- Explore product categories and apply product filters.
- View product information and available variants.
- Manage shopping cart and wishlist.
- Proceed through the checkout workflow.
- View orders and track order status.
- Manage customer profile and delivery addresses.
- Access an AI-powered shopping assistant.

### Seller Portal
- Access seller-specific interfaces.
- Manage product variants through dedicated components.
- Integrate with backend services for product and order management.
- Support seller workflows through role-specific navigation.

### Admin Portal
- Dedicated administrative layout and navigation.
- Integration with administration services.
- Support for user management, reports, and other administrative features through backend APIs.

### AI Shopping Assistant
- Interactive chat interface.
- Dedicated chat widget, chat window, input, and message components.
- Frontend integration with the AI backend service.

### Technical Features
- TypeScript for type-safe development.
- Reusable React components.
- Centralized API communication.
- Dedicated service modules for application features.
- Role-aware layouts and access-control components.
- Dockerfile for containerized deployment.

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Frontend framework and application routing |
| React | Component-based user interface |
| TypeScript | Type safety and maintainability |
| Tailwind CSS | Styling and responsive layouts |
| Shadcn-style UI components | Reusable interface components |
| Lucide React | Icons, where used |
| FastAPI | Backend API integration |
| PostgreSQL | Backend data persistence |
| Docker | Containerized frontend deployment |

The frontend communicates with the backend API. Database operations and business logic are handled by the backend rather than directly by the browser.

## Project Structure

```text
shopshere-frontend/
├── app/
│   ├── addresses/
│   ├── admin/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── products/
│   ├── profile/
│   ├── seller/
│   ├── wishlist/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ai-chat/
│   ├── auth/
│   ├── cart/
│   ├── checkout/
│   ├── layout/
│   ├── orders/
│   ├── products/
│   └── ui/
├── docs/
│   └── frontend-architecture.md
├── lib/
│   └── utils.ts
├── services/
│   ├── addresses.ts
│   ├── adminUsers.ts
│   ├── ai.ts
│   ├── api.ts
│   ├── auth.ts
│   ├── cart.ts
│   ├── categories.ts
│   ├── coupons.ts
│   ├── orders.ts
│   ├── payments.ts
│   ├── product-options.ts
│   ├── products.ts
│   ├── product-variant-images.ts
│   ├── product-variants.ts
│   ├── reports.ts
│   ├── reviews.ts
│   └── wishlist.ts
├── types/
│   ├── ai.ts
│   ├── auth.ts
│   ├── cart.ts
│   ├── category.ts
│   ├── order.ts
│   └── product.ts
├── Dockerfile
├── .dockerignore
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

*Note: This is a representative structure based on the inspected files. Some directories contain additional files and nested routes.*

## Getting Started

### Prerequisites

Install the following tools before starting development:

- Node.js compatible with the project's Next.js version.
- npm.
- Git.
- A running ShopSphere backend API for features that require server communication.

### 1. Clone the Repository

```bash
git clone <YOUR_FRONTEND_REPOSITORY_URL>
cd shopshere-frontend
```

Replace `<YOUR_FRONTEND_REPOSITORY_URL>` with your actual frontend Git repository URL.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create or update the `.env.local` file in the frontend root directory.

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Use the actual URL where your backend API is running. For production, configure the appropriate deployed backend URL.

**Security:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never place database passwords, private API keys, Stripe secret keys, or other server-side secrets in frontend environment variables.

Do not commit `.env.local` or other files containing secrets to Git.

### 4. Start the Development Server

```bash
npm run dev
```

Open:

http://localhost:3000

If port 3000 is already in use, stop the existing development server or use the alternative port reported by Next.js.

## Available Scripts

The exact scripts depend on `package.json`. Standard Next.js projects commonly provide the following commands:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

- `dev` — Starts the development server.
- `build` — Creates a production build.
- `start` — Starts the production server after a successful build.
- `lint` — Runs the configured linting command, if present.

Check `package.json` to confirm the scripts available in this repository.

## Frontend Architecture

ShopSphere separates application pages, reusable UI components, API services, and TypeScript types.

### Application Pages — `app/`

Contains the Next.js App Router pages and layouts for shopping, cart, checkout, orders, profile, addresses, wishlist, and role-specific interfaces.

### Reusable Components — `components/`

Contains shared components for product displays, navigation, cart operations, checkout, order tracking, authentication, and AI chat.

### API Services — `services/`

Organizes backend communication by feature, including:

- Authentication
- Products and categories
- Cart and orders
- Addresses and payments
- Wishlist and reviews
- Product variants, options, and variant images
- Coupons and reports
- AI shopping assistant
- Administrative user operations

### Type Definitions — `types/`

Contains TypeScript definitions for shared application data, including products, users, categories, carts, orders, and AI-related types.

### Utilities — `lib/`

Contains shared utility functions.

### Architecture Documentation — `docs/`

Contains frontend architecture documentation.

## Backend Integration

The frontend is designed to communicate with the ShopSphere backend API.

The API service layer is located at:

```text
services/api.ts
```

Feature-specific API operations are organized in separate service files. This separation makes it easier to maintain API communication without placing all request logic directly inside page components.

To run the complete application, ensure the backend is running and the frontend API URL points to the correct backend instance.

## Docker

The repository contains a `Dockerfile` for building a frontend container image.

From the frontend directory, build the image using:

```bash
docker build -t shopsphere-frontend .
```

To run the container, use the port