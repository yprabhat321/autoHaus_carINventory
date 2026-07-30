import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import VehicleDetails from './pages/VehicleDetails.jsx';
import PurchaseHistory from './pages/PurchaseHistory.jsx';
import InvoiceManagement from './pages/InvoiceManagement.jsx';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));

const App = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vehicles/:id"
            element={<ProtectedRoute><VehicleDetails /></ProtectedRoute>}
          />
          <Route
            path="/purchases"
            element={<ProtectedRoute><PurchaseHistory /></ProtectedRoute>}
          />
          <Route
            path="/invoices"
            element={<ProtectedRoute><InvoiceManagement /></ProtectedRoute>}
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute adminOnly>
                <Suspense fallback={<div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 text-steel-600">Loading dashboard…</div>}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <div className="max-w-7xl mx-auto px-6 py-24 text-center">
                <p className="eyebrow">404</p>
                <h1 className="font-display text-4xl mt-2">Page not found</h1>
              </div>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App;
