import { lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import Login from '@/pages/Login';

// Screens load on demand (code-split) so the first download stays small.
// The layout wraps <Outlet /> in <Suspense> so the shell stays visible while a screen loads.
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Farmers = lazy(() => import('@/pages/farmers/Farmers'));
const FarmerProfile = lazy(() => import('@/pages/farmers/FarmerProfile'));
const Onboarding = lazy(() => import('@/pages/farmers/Onboarding'));
const Contracts = lazy(() => import('@/pages/farmers/Contracts'));
const PriceTemplates = lazy(() => import('@/pages/farmers/PriceTemplates'));
const Collection = lazy(() => import('@/pages/collection/Collection'));
const Logistics = lazy(() => import('@/pages/collection/Logistics'));
const Quality = lazy(() => import('@/pages/collection/Quality'));
const Payments = lazy(() => import('@/pages/finance/Payments'));
const Approvals = lazy(() => import('@/pages/finance/Approvals'));
const Reports = lazy(() => import('@/pages/finance/Reports'));
const ErpConnectors = lazy(() => import('@/pages/admin/ErpConnectors'));
const ErpSync = lazy(() => import('@/pages/admin/ErpSync'));
const UsersRoles = lazy(() => import('@/pages/admin/UsersRoles'));
const Settings = lazy(() => import('@/pages/admin/Settings'));
const Masters = lazy(() => import('@/pages/admin/Masters'));
const FieldCollect = lazy(() => import('@/pages/mobile/MobileCollect'));
const FieldDriver = lazy(() => import('@/pages/mobile/MobileDriver'));
const FarmerPortal = lazy(() => import('@/pages/mobile/MobileFarmer'));

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="farmers" element={<Farmers />} />
        <Route path="farmers/:id" element={<FarmerProfile />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="price-templates" element={<PriceTemplates />} />
        <Route path="collection" element={<Collection />} />
        <Route path="logistics" element={<Logistics />} />
        <Route path="quality" element={<Quality />} />
        <Route path="payments" element={<Payments />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="reports" element={<Reports />} />
        <Route path="erp" element={<ErpConnectors />} />
        <Route path="erp/sync" element={<ErpSync />} />
        <Route path="users" element={<UsersRoles />} />
        <Route path="settings" element={<Settings />} />
        <Route path="masters" element={<Navigate to="/masters/regions" replace />} />
        <Route path="masters/:tab" element={<Masters />} />
        <Route path="field/collect" element={<FieldCollect />} />
        <Route path="field/driver" element={<FieldDriver />} />
        <Route path="field/farmer" element={<FarmerPortal />} />
      </Route>

      {/* Old links to the former separate mobile shell */}
      <Route path="/mobile/driver" element={<Navigate to="/field/driver" replace />} />
      <Route path="/mobile/farmer" element={<Navigate to="/field/farmer" replace />} />
      <Route path="/mobile/*" element={<Navigate to="/field/collect" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
