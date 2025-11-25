# AI Mortgage Calculator

## Overview

An AI-powered mortgage calculator mobile application that provides instant, accurate mortgage estimates. Users can input property details (address, asking price, and optional photos) to receive comprehensive mortgage breakdowns including principal, interest, property taxes, insurance, HOA fees, and other costs. The application features user authentication via Replit Auth, financial profile management, and the ability to save and track multiple property calculations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, built using Vite as the build tool and bundler.

**Routing**: Wouter for lightweight client-side routing with the following main routes:
- `/` - Landing page (unauthenticated) or Home page (authenticated)
- `/profile` - User financial profile management
- `/saved` - List of saved mortgage calculations
- `/alerts` - Placeholder for future rate change alerts
- `/breakdown/:id` - Detailed breakdown of a specific mortgage calculation

**State Management**: TanStack Query (React Query) for server state management with aggressive caching (`staleTime: Infinity`) to minimize unnecessary API calls. No global client state management library is used beyond React's built-in hooks.

**UI Component Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The design system follows a mobile-first, fintech-inspired aesthetic with custom CSS variables for theming.

**Form Handling**: React Hook Form with Zod validation for type-safe form schemas shared between client and server.

**Design System**: 
- Uses Inter font family for web consistency
- Mobile-first responsive design with bottom navigation
- Tailwind spacing primitives (p-3, p-4, p-6, p-8, p-12)
- Custom color system using HSL CSS variables for theme flexibility
- Card-based layouts with consistent padding and spacing

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript in ESM (ES Modules) mode.

**Development vs Production**: Separate entry points (`index-dev.ts` and `index-prod.ts`) handle development with Vite middleware HMR and production with static file serving from the build directory.

**API Design**: RESTful API structure with the following key endpoints:
- `GET /api/auth/user` - Fetch current authenticated user
- `GET /api/profile` - Retrieve user's financial profile
- `PUT /api/profile` - Update financial profile
- `POST /api/calculate-mortgage` - Calculate mortgage with AI assistance
- `GET /api/calculations` - List all saved calculations for a user
- `GET /api/calculations/:id` - Get specific calculation details
- `POST /api/calculations/:id/save` - Save a calculation
- `DELETE /api/calculations/:id` - Delete a saved calculation

**Session Management**: Express-session with PostgreSQL-backed session storage (`connect-pg-simple`) for persistent sessions. Sessions last 7 days with secure, httpOnly cookies.

### Data Storage

**Database**: PostgreSQL via Neon's serverless driver with WebSocket support for serverless environments.

**ORM**: Drizzle ORM for type-safe database queries with schema defined in `shared/schema.ts`. The ORM provides:
- Type-safe queries with TypeScript inference
- Schema migrations via `drizzle-kit`
- Zod schema generation from database schema using `drizzle-zod`

**Database Schema**:
- `sessions` - Session storage for authentication
- `users` - User accounts (id, email, name, profile image)
- `financial_profiles` - User financial information (age, income, credit score, down payment, mortgage type, monthly debt, homestead exemption)
- `saved_calculations` - Mortgage calculations with full breakdown (address, asking price, all payment components, timestamps)

**Data Access Pattern**: Repository pattern implemented via `IStorage` interface in `server/storage.ts` with `DatabaseStorage` implementation. This abstraction allows for potential storage backend swapping.

### Authentication & Authorization

**Authentication Provider**: Replit Auth using OpenID Connect (OIDC) protocol.

**Implementation**: Passport.js strategy with custom middleware (`isAuthenticated`) protecting routes that require authentication. The system handles:
- OIDC discovery and configuration
- Token refresh for long-lived sessions
- User profile synchronization with database
- Automatic redirect to login for unauthenticated requests

**Session Security**: 
- Sessions stored server-side in PostgreSQL
- Secure cookies with httpOnly flag
- 7-day session expiration
- CSRF protection via session secret

### External Dependencies

**AI Integration**: Replit AI Integrations service providing OpenAI-compatible API access without requiring separate API keys. Located at `server/openai.ts`, though the current implementation uses simplified mortgage calculations instead of actual AI calls to avoid latency.

**Mortgage Calculation Logic**: Currently uses standard financial formulas rather than AI:
- Interest rate determination based on credit score tiers
- PMI calculation for down payments < 20%
- Property tax estimation at 1.2% of home value annually
- Insurance estimations (homeowners: 0.5% annually, flood: $600/year flat)
- HOA fees estimation based on property value tiers

**Font Service**: Google Fonts (Inter font family) loaded via CDN for consistent typography.

**Third-Party UI Components**: 
- Radix UI for accessible, unstyled component primitives
- Lucide React for icon library
- React Day Picker for date selection (calendar component)
- Recharts for potential chart visualizations
- CMDK for command palette functionality
- Embla Carousel for carousel components

**Development Tools**:
- Replit-specific plugins for runtime error overlay, cartographer, and dev banner
- ESBuild for production server bundling
- PostCSS with Tailwind CSS and Autoprefixer for styling

**Environment Variables Required**:
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `SESSION_SECRET` - Session encryption key
- `ISSUER_URL` - OIDC issuer URL for Replit Auth
- `REPL_ID` - Replit application identifier
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - AI service endpoint
- `AI_INTEGRATIONS_OPENAI_API_KEY` - AI service authentication key