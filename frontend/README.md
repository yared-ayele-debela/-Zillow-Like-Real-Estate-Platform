# Zillow Clone – Frontend

React SPA for the real estate platform. Uses Create React App, React Router, TanStack Query, Tailwind CSS, Zustand, and integrates with the Laravel API (auth, properties, payments, notifications).

## Scripts

| Command | Description |
|--------|-------------|
| `npm start` | Dev server at [http://localhost:3000](http://localhost:3000) |
| `npm run build` | Production build (output in `build/`) |
| `npm test` | Run tests (watch mode) |

## Environment

Copy `.env.example` to `.env` and set:

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Main structure

- **`src/App.js`** – Routes (public, agent, admin, protected)
- **`src/pages/`** – Page components (Home, PropertyDetail, AgentDashboard, AdminDashboard, etc.)
- **`src/components/`** – Reusable UI (auth, property cards/forms/gallery, agent/admin layouts, payment, etc.)
- **`src/services/`** – API clients (auth, property, payment, dashboard, admin, etc.)
- **`src/store/`** – Zustand store (e.g. `authStore`)
- **`src/utils/`** – Helpers (e.g. `defaultImages.js` for property placeholder)
- **`public/default_images/`** – Default property image when none available

## Features (summary)

- Public: home, property list/detail, compare, mortgage calculator, agent profile, auth, profile, favorites, saved searches, messages, reviews, notifications, payments
- Agent: dashboard, my properties, leads, offers, analytics, profile (in-dashboard)
- Admin: dashboard, users, properties, reviews, analytics, reports, locations, settings, roles/permissions, payment config, profile (in-dashboard)

See the **root README** for full project setup and API details.
