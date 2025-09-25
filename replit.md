# Luton Hospital Online Pharmacy

## Recent Changes (September 25, 2025)

### Complete Platform Transformation
- **Three-Tier Header System**: Implemented professional top bar with license information and social media integration, comprehensive main header with location search, full search functionality, supplements navigation, account management, and compare/wishlist/cart features with live counters
- **Homepage Enhancement**: Added four new sections matching PharmaPlus design - Trending Products, Best Sellers, Shop By Your Health Condition, and New Arrivals - all featuring KES pricing, discount badges, star ratings, and professional layouts
- **Shop Page Improvements**: Enhanced product cards with accessible star ratings, proper aria-labels, and comprehensive data-testid attributes for testing compatibility
- **PharmaPlus Layout Adoption**: Successfully replicated the exact look and functionality of shop.pharmaplus.co.ke while maintaining Luton Hospital branding and green/red color scheme
- **Professional E-commerce Experience**: Comprehensive shopping journey with category navigation, health condition targeting, social proof elements, and mobile-responsive design

## Overview

This is a full-stack web application for Luton Hospital's online pharmacy system. It provides a comprehensive platform for patients to manage prescriptions, place orders, and make payments, while allowing pharmacy staff to handle prescription approvals, order processing, and inventory management. The application features a modern React frontend with TypeScript, Express.js backend, PostgreSQL database, and integrates with Stripe for payments and SendGrid for email notifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and building
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with role-based access control
- **Authentication**: OpenID Connect with Replit Auth integration using Passport.js
- **Session Management**: Express sessions with PostgreSQL storage
- **Input Validation**: Zod schemas for runtime type checking and validation

### Database Design
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database queries and migrations
- **Schema Management**: Shared schema definitions between frontend and backend
- **Key Entities**: Users (patients/pharmacists/admin), prescriptions, orders, addresses, inventory, notifications
- **Relationships**: Proper foreign key constraints and indexes for data integrity

### Payment Processing
- **Provider**: Stripe integration for secure payment handling
- **Implementation**: React Stripe.js components for frontend payment forms
- **Flow**: Payment intents with server-side confirmation for security
- **Support**: Card payments with potential for additional methods

### Email Service
- **Provider**: SendGrid for transactional emails
- **Use Cases**: Prescription status updates, order confirmations, notifications
- **Fallback**: Graceful degradation when email service is unavailable

### Authentication & Authorization
- **Method**: OpenID Connect with Replit's authentication service
- **Session Storage**: Database-backed sessions for scalability
- **Role-Based Access**: Patient, pharmacist, and admin roles with appropriate permissions
- **Security**: Secure cookie handling and CSRF protection

### Development Workflow
- **Build System**: Vite for frontend bundling with hot module replacement
- **Database Migrations**: Drizzle Kit for schema migrations and database management
- **Environment**: Development and production configurations with environment variables
- **Deployment**: Production build with static file serving and API routes

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting for data persistence
- **Replit Authentication**: OpenID Connect provider for user authentication
- **Stripe**: Payment processing and subscription management
- **SendGrid**: Email delivery service for notifications

### Development Tools
- **Vite**: Build tool and development server with React plugin
- **Drizzle Kit**: Database schema management and migration tool
- **TypeScript**: Static type checking across the entire stack

### Third-Party Libraries
- **UI Components**: Radix UI primitives for accessible component foundation
- **Validation**: Zod for runtime schema validation and type inference
- **HTTP Client**: Native fetch API with custom wrapper for API requests
- **Session Storage**: Connect-pg-simple for PostgreSQL session storage

### Optional Integrations
- **M-Pesa**: Mobile payment integration (referenced in project brief)
- **File Upload**: Potential prescription photo upload capability
- **Push Notifications**: Real-time updates for prescription status changes