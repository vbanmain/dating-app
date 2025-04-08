# Modern Dating Platform

A full-featured dating application that helps users find meaningful connections through intelligent matching algorithms and engaging user experiences.

## Features

- **User Profiles**: Comprehensive user profiles with interests, preferences, and photos
- **Smart Matching**: Advanced matching algorithm based on location, interests, and preferences
- **Real-time Messaging**: Seamless messaging between matched users with read receipts
- **Ice Breaker Suggestions**: AI-powered conversation starters to help initiate interactions
- **Premium Subscriptions**: Tiered subscription plans with Stripe payment integration
- **Responsive Design**: Fully responsive UI that works on desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn UI components
- **Backend**: Node.js with Express
- **Database**: In-memory storage (can be easily migrated to PostgreSQL)
- **Authentication**: Session-based authentication
- **Payments**: Stripe payment gateway integration
- **State Management**: React Query for server state management

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Stripe account with API keys (for payment functionality)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/vbamain/dating-app.git
   cd dating-app
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with the following:
   ```
   STRIPE_SECRET_KEY=your_stripe_secret_key
   VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5000`

## Project Structure

- `client/`: React frontend code
  - `src/components/`: Reusable UI components
  - `src/pages/`: Page components for each route
  - `src/hooks/`: Custom React hooks
  - `src/lib/`: Utility functions and shared logic
  - `src/context/`: React context providers

- `server/`: Express backend code
  - `services/`: Business logic services
  - `routes.ts`: API route definitions
  - `storage.ts`: Data storage and retrieval logic

- `shared/`: Code shared between frontend and backend
  - `schema.ts`: Data models and validation schemas

## License

This project is licensed under the MIT License - see the LICENSE file for details.
