# MILCO Farmer & Milk Collection – Web UI

React frontend for the MILCO Farmer & Milk Collection system (ERP integration with Odoo, SAP Business One and SAP S/4HANA).

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · React Router · Recharts · lucide-react
**Backend (separate):** Node.js · PostgreSQL · Prisma

## Run it

```bash
cd client
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

Sign in with any password on the **Office staff** tab, or use **Field staff** with any mobile number and any 6-digit code (sample login; replace with the real auth API).

## Screens

| Area | Route | File |
|---|---|---|
| Login (staff password / SSO, field staff OTP) | `/login` | `pages/Login.tsx` |
| Dashboard | `/` | `pages/Dashboard.tsx` |
| Farmer list | `/farmers` | `pages/farmers/Farmers.tsx` |
| Farmer profile (details, supply, payments, deductions, compliance, documents, audit) | `/farmers/:id` | `pages/farmers/FarmerProfile.tsx` |
| Farmer onboarding wizard | `/onboarding` | `pages/farmers/Onboarding.tsx` |
| Contracts & price matrix | `/contracts` | `pages/farmers/Contracts.tsx` |
| Daily milk collection | `/collection` | `pages/collection/Collection.tsx` |
| Centers, routes & tankers | `/logistics` | `pages/collection/Logistics.tsx` |
| Quality exceptions & disputes | `/quality` | `pages/collection/Quality.tsx` |
| Payment run | `/payments` | `pages/finance/Payments.tsx` |
| Approvals inbox | `/approvals` | `pages/finance/Approvals.tsx` |
| Reports & analytics | `/reports` | `pages/finance/Reports.tsx` |
| ERP connectors (Odoo / SAP B1 / S/4HANA) | `/erp` | `pages/admin/ErpConnectors.tsx` |
| ERP field mapping & sync log | `/erp/sync` | `pages/admin/ErpSync.tsx` |
| Users, roles & permissions | `/users` | `pages/admin/UsersRoles.tsx` |
| System settings | `/settings` | `pages/admin/Settings.tsx` |
| Mobile: field collection | `/mobile/collect` | `pages/mobile/MobileCollect.tsx` |
| Mobile: tanker driver | `/mobile/driver` | `pages/mobile/MobileDriver.tsx` |
| Mobile: farmer app | `/mobile/farmer` | `pages/mobile/MobileFarmer.tsx` |

## Project layout

```
src/
  api/client.ts          fetch wrapper for the Node API (/api/*, JWT bearer)
  components/layout/     AppLayout (sidebar, top bar, mobile drawer), MobileShell
  components/ui/         Badge, Card, DataTable, Field, Tabs, Stepper, Modal, Toggle, StatCard, FakeMap…
  config/nav.ts          sidebar menu
  context/               AuthContext (session), ToastContext (notifications)
  data/mock.ts           sample data – one export per future API resource
  lib/pricing.ts         FAT/SNF price matrix, category premium, delivery evaluation
  lib/format.ts          Rs / number formatting
  pages/                 one file per screen
```

## Connecting the Node.js API

1. Copy `.env.example` to `.env`. In development `/api` is proxied to `http://localhost:4000` (see `vite.config.ts`).
2. Each page imports its data from `src/data/mock.ts`. Replace that import with `api.get('/farmers')` (from `src/api/client.ts`), ideally through a small hook per resource.
3. The shapes in `mock.ts` (`Farmer`, `Center`, `Delivery`, `Tanker`, `Contract`, `PaymentLine`, `Approval`, `SyncLogEntry`, …) are meant to map 1:1 to Prisma models and API responses.
4. `lib/pricing.ts` mirrors the server-side price rules so the collection screen can show the value instantly. The server stays the source of truth.

## Notes

- Fully responsive: the sidebar becomes a drawer below 1024 px, tables scroll inside their cards, forms stack to one column on phones.
- The map is a placeholder (`components/ui/FakeMap.tsx`). Swap in Leaflet + OpenStreetMap, Google Maps or Mapbox.
- Brand colour `#D71920` is the `brand` palette in `tailwind.config.js`.
