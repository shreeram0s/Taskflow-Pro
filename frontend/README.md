# TaskFlow Frontend

A modern React + TypeScript + Vite frontend for the TaskFlow project management application.

## Features

- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Shadcn/UI** components (Radix UI primitives)
- **React Router** for navigation
- **Axios** for API calls
- **React Beautiful DnD** for drag and drop
- **Recharts** for analytics charts

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL:
```
VITE_API_URL=http://localhost:8000/api
```

4. Start development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── context/       # React context providers
├── services/      # API service functions
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── main.tsx       # Application entry point
```

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Radix UI** - Accessible components
- **Lucide React** - Icons
- **React Router** - Routing
- **Axios** - HTTP client
