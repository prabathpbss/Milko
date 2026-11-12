# MILCO Farmer Management

Farmer & milk collection management system for MILCO, with ERP integration for Odoo, SAP Business One and SAP S/4HANA.

**Stack:** React · Node.js · PostgreSQL · Prisma

| Folder | Contents | Status |
|---|---|---|
| [`client/`](client/) | React web app (desktop + mobile-friendly) and field / driver / farmer phone screens | UI complete with sample data |
| `server/` | Node.js API, Prisma schema, ERP connectors | Not started |

## Quick start (web UI)

```bash
cd client
npm install
npm run dev   # http://localhost:5173
```

See [client/README.md](client/README.md) for the screen list, project layout and how to connect the API.
