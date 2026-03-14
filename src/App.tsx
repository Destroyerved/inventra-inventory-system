/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Operations from "./pages/Operations";
import MoveHistory from "./pages/MoveHistory";
import Stock from "./pages/Stock";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Finances from "./pages/Finances";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="stock" element={<Stock />} />
          <Route path="receipts" element={<Operations type="receipt" />} />
          <Route path="deliveries" element={<Operations type="delivery" />} />
          <Route path="transfers" element={<Operations type="transfer" />} />
          <Route path="adjustments" element={<Operations type="adjustment" />} />
          <Route path="history" element={<MoveHistory />} />
          <Route path="finances" element={<Finances />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
