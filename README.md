# Inventra - Inventory Management System

Inventra is a complete modular Inventory Management System designed for warehouse and business environments to replace manual inventory registers and Excel sheets.

## 1. System Architecture Diagram

```mermaid
graph TD
    Client[React Frontend (Vite)] -->|REST API| Server[Node.js + Express Backend]
    Server -->|SQL Queries| DB[(SQLite Database)]
    
    subgraph Frontend Modules
        AuthUI[Authentication]
        DashboardUI[Dashboard & Analytics]
        ProductsUI[Product Management]
        OpsUI[Operations: Receipts, Deliveries, Transfers, Adjustments]
        LedgerUI[Stock Ledger / Move History]
    end
    
    subgraph Backend Modules
        AuthAPI[Auth Routes]
        ProductsAPI[Products Routes]
        InventoryAPI[Inventory Routes]
        OpsAPI[Operations Routes]
        DashboardAPI[Dashboard Routes]
    end
    
    Client --> Frontend Modules
    Server --> Backend Modules
```

## 2. Database Schema

The database is built using SQLite (as a prototype for PostgreSQL) with the following tables:

*   **users**: `id`, `email`, `password`, `name`, `role`
*   **categories**: `id`, `name`
*   **warehouses**: `id`, `name`, `location`
*   **locations**: `id`, `warehouse_id`, `name`
*   **products**: `id`, `name`, `sku`, `category_id`, `uom`, `reorder_level`
*   **inventory**: `id`, `product_id`, `location_id`, `quantity` (Tracks current stock)
*   **operations**: `id`, `type`, `status`, `date`, `user_id`, `source_location_id`, `dest_location_id`
*   **operation_lines**: `id`, `operation_id`, `product_id`, `quantity`
*   **stock_ledger**: `id`, `operation_id`, `product_id`, `quantity_change`, `source_location_id`, `dest_location_id`, `timestamp`, `user_id` (Immutable log of all movements)

## 3. Backend Folder Structure

```
/server
  ├── db.ts               # Database initialization and connection
  ├── routes/
  │   ├── auth.ts         # Authentication (login, signup, JWT validation)
  │   ├── dashboard.ts    # Dashboard statistics and KPIs
  │   ├── inventory.ts    # Current stock levels and locations
  │   ├── operations.ts   # Receipts, deliveries, transfers, adjustments
  │   └── products.ts     # Product catalog management
```

## 4. Frontend Folder Structure

```
/src
  ├── components/
  │   └── Layout.tsx      # Sidebar navigation and topbar
  ├── lib/
  │   └── api.ts          # API fetch wrapper with auth token injection
  ├── pages/
  │   ├── Dashboard.tsx   # KPI cards and Recharts bar chart
  │   ├── Login.tsx       # Authentication page
  │   ├── MoveHistory.tsx # Stock ledger view
  │   ├── Operations.tsx  # Generic page for Receipts/Deliveries/Transfers
  │   └── Products.tsx    # Product list and creation modal
  ├── store/
  │   └── authStore.ts    # Zustand state management for user session
  ├── App.tsx             # React Router setup
  └── main.tsx            # React entry point
```

## 5. API Endpoints

*   **Auth**: 
    *   `POST /api/auth/login` - Authenticate user
    *   `POST /api/auth/signup` - Register new user
    *   `GET /api/auth/me` - Get current user profile
*   **Dashboard**: 
    *   `GET /api/dashboard/stats` - Get KPIs (total products, low stock, etc.)
*   **Products**: 
    *   `GET /api/products` - List all products with current stock
    *   `POST /api/products` - Create a new product
    *   `GET /api/products/categories` - List product categories
*   **Inventory**: 
    *   `GET /api/inventory` - Get current stock per location
    *   `GET /api/inventory/warehouses` - List warehouses
    *   `GET /api/inventory/locations` - List specific rack/bin locations
*   **Operations**: 
    *   `GET /api/operations` - List all operations
    *   `POST /api/operations` - Create a new operation (Receipt, Delivery, Transfer, Adjustment)
    *   `GET /api/operations/ledger` - Get the immutable stock ledger history

## 6. Example UI Layout

The UI follows a modern dashboard layout:
*   **Left Sidebar**: Dark theme (`bg-slate-900`) with navigation links (Dashboard, Products, Receipts, Deliveries, Transfers, Adjustments, Move History) and user profile at the bottom.
*   **Top Header**: White background, displays the current page title.
*   **Main Content Area**: Light gray background (`bg-slate-50`) with white cards for data tables and charts. Uses Tailwind CSS for responsive design.

## 7. Sample Data Flow for Inventory Operations

**Scenario: Receiving 50 Laptops from a Supplier**

1.  **User Action**: Warehouse staff navigates to "Receipts" and clicks "New Receipt".
2.  **Form Input**: Selects Destination Location (e.g., "Main Warehouse - Rack A1"), adds Product "Laptop Pro", and sets Quantity to 50.
3.  **API Request**: Frontend sends `POST /api/operations` with `type: "receipt"`, `dest_location_id: 1`, and `lines: [{ product_id: 1, quantity: 50 }]`.
4.  **Backend Transaction**:
    *   Inserts a new record into `operations`.
    *   Inserts a new record into `operation_lines`.
    *   Updates `inventory` table: `UPDATE inventory SET quantity = quantity + 50 WHERE product_id = 1 AND location_id = 1`.
    *   Inserts a new record into `stock_ledger` with `quantity_change: 50`.
5.  **UI Update**: The Receipts list refreshes, and the Dashboard KPIs (Total Stock) update accordingly.
