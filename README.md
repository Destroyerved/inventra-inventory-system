# Inventra – Inventory Management System

Inventra is a modular inventory management system for warehouses and growing businesses.  
It replaces manual registers and Excel sheets with a modern dashboard for products, stock, operations, and basic finances.

2nd Runner Up project at Codeversity Hackathon 2026 @IIT Gandhinagar

---

## Features

- **Authentication & roles**
  - Login / signup with seeded demo users
  - Roles: admin, manager, staff
- **Product & catalog management**
  - Categories, products, SKUs, barcodes, suppliers
  - Reorder levels and pricing
- **Warehouse & locations**
  - Multiple warehouses
  - Storage locations (racks / shelves / bins)
- **Inventory & operations**
  - Inbound receipts, outbound deliveries, internal transfers, adjustments
  - Per‑location stock tracking
  - Immutable stock ledger / move history
- **Dashboard & reports**
  - KPIs, low‑stock alerts, recent operations
  - Basic income/expense tracking for operations

---

## Live Demo

[https://inventra-inventory-system.onrender.com/](https://inventra-inventory-system.onrender.com/)

---

## Tech Stack

- **Frontend**: React 19, React Router, Vite, Tailwind CSS, Recharts, Zustand
- **Backend**: Node.js, Express
- **Database**: SQLite (via `better-sqlite3`) – file‑based DB (`inventory.db`)
- **Auth**: JSON Web Tokens (JWT), bcryptjs
- **Build & Tooling**: TypeScript, Vite, tsx

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 20+ (or a recent LTS)
- npm

### 1. Clone & install

```bash
git clone <your-repo-url>
cd inventra
npm install
```

### 2. Environment variables

Create a `.env` file in the project root based on `.env.example`:

```env
GEMINI_API_KEY=your_api_key_here
APP_URL=http://localhost:3000
```

> For local development the app will work without a real `GEMINI_API_KEY`, as long as you don’t hit AI-powered endpoints.  

### 3. Run in development mode

```bash
npm run dev
```

The Express server starts on `http://localhost:3000` and proxies Vite in middleware mode.  
The database file `inventory.db` is created in the `server` folder on first run.

---

## Production Build & Run

### Build frontend

```bash
npm run build
```

This generates the SPA into `dist/`. In production, Express serves `dist/` as static files.

### Start in production mode

```bash
NODE_ENV=production npm run start
```

By default the app listens on port `3000`.  
You can override it with `PORT`:

```bash
PORT=8080 NODE_ENV=production npm run start
```

---

## Docker & Deployment (Render Example)

This repo includes a `Dockerfile` and `.dockerignore` for containerized deployment.

### Build & run with Docker

```bash
docker build -t inventra-app .
docker run -p 3000:3000 --env-file .env inventra-app
```

Then open `http://localhost:3000`.

### Deploying to Render (Web Service, Docker)

1. Push this repo to GitHub/GitLab.
2. On Render:
   - **New → Web Service**
   - Connect the repo
   - **Environment**: Docker
   - Leave **Build Command** and **Start Command** empty (Dockerfile is used).
3. Set environment variables:
   - `NODE_ENV=production`
   - `GEMINI_API_KEY=<your key>`
   - `APP_URL=https://<your-service-name>.onrender.com`
4. Deploy. Render will build the image and start the container.  
   The service URL becomes your app’s public address.

---

## Database Schema (SQLite)

Core tables:

- **users**: `id`, `login_id`, `email`, `password`, `name`, `role`, `otp`, `otp_expiry`
- **categories**: `id`, `name`
- **warehouses**: `id`, `name`, `location`, `manager_name`, `contact_number`
- **locations**: `id`, `warehouse_id`, `name`
- **products**: `id`, `name`, `sku`, `category_id`, `uom`, `reorder_level`, `price`, `cost`, `description`, `barcode`, `supplier`
- **inventory**: `id`, `product_id`, `location_id`, `quantity`
- **operations**: `id`, `reference`, `contact`, `scheduled_date`, `type`, `status`, `date`, `user_id`, `source_location_id`, `dest_location_id`, `notes`, `tracking_number`, `shipping_method`
- **operation_lines**: `id`, `operation_id`, `product_id`, `quantity`
- **stock_ledger**: `id`, `reference`, `operation_id`, `product_id`, `quantity_change`, `source_location_id`, `dest_location_id`, `timestamp`, `user_id`
- **transactions**: `id`, `type`, `amount`, `date`, `reference`, `description`

The schema is initialized and seeded in `server/db.ts`.

---

## Seeded Demo Data & Logins

On first run, if the `users` table is empty, the app seeds:

- **Admin**  
  - Login ID: `admin123`  
  - Email: `admin@inventra.com`  
  - Password: `admin123`
- **Manager**  
  - Login ID: `manager1`  
  - Email: `manager@inventra.com`  
  - Password: `manager123`
- **Staff**  
  - Login ID: `staff1`  
  - Email: `staff@inventra.com`  
  - Password: `staff123`

It also seeds example categories, warehouses, locations, products, inventory levels, operations, stock ledger entries, and financial transactions so dashboards and reports render meaningful data immediately.

---

## Project Structure

### Backend

```text
/server
  ├── db.ts               # Database initialization, schema, seed data
  └── routes/
      ├── auth.ts         # Authentication (login, signup, JWT validation)
      ├── dashboard.ts    # Dashboard statistics and KPIs
      ├── inventory.ts    # Current stock levels and locations
      ├── operations.ts   # Receipts, deliveries, transfers, adjustments
      ├── products.ts     # Product catalog management
      └── finances.ts     # Income/expense tracking
```

### Frontend

```text
/src
  ├── components/
  │   └── Layout.tsx      # Sidebar navigation and top bar
  ├── lib/
  │   └── api.ts          # API client with auth token injection
  ├── pages/
  │   ├── Dashboard.tsx
  │   ├── Login.tsx
  │   ├── Signup.tsx
  │   ├── Products.tsx
  │   ├── Stock.tsx
  │   ├── Operations.tsx
  │   ├── MoveHistory.tsx
  │   ├── Finances.tsx
  │   └── Settings.tsx
  ├── store/
  │   └── authStore.ts    # Zustand state for user session
  ├── App.tsx             # Routes & layout
  └── main.tsx            # React entry point
```

---

## Roadmap / Ideas

- Multi‑tenant support (multiple companies)
- Advanced reporting & exports
- Role‑based permissions per module
- PostgreSQL support for production deployments
- Deeper barcode/QR integration for mobile scanners

---

## Authors

<p align="center">
  <table>
    <tr>
      <td align="center" width="50%">
        <div>
          <img src="https://avatars.githubusercontent.com/Sam-bot-dev?s=120" width="120px;" height="120px;" alt="Bhavesh"/>
        </div>
        <div><strong>⭐ Team Lead</strong></div>
        <div><strong>Bhavesh</strong></div>
        <a href="https://github.com/Sam-bot-dev">🌐 GitHub</a>
      </td>
      <td align="center" width="50%">
        <div>
          <img src="https://avatars.githubusercontent.com/notUbaid?s=120" width="120px;" height="120px;" alt="Ubaid khan"/>
        </div>
        <div><strong>Teammate</strong></div>
        <div><strong>Ubaid khan</strong></div>
        <a href="https://github.com/notUbaid">🌐 GitHub</a>
      </td>
    </tr>
  </table>
</p>
- Ansh


