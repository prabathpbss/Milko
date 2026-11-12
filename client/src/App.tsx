import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import MobileShell from '@/components/layout/MobileShell';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Farmers from '@/pages/farmers/Farmers';
import FarmerProfile from '@/pages/farmers/FarmerProfile';
import Onboarding from '@/pages/farmers/Onboarding';
import Contracts from '@/pages/farmers/Contracts';
import Collection from '@/pages/collection/Collection';
import Logistics from '@/pages/collection/Logistics';
import Quality from '@/pages/collection/Quality';
import Payments from '@/pages/finance/Payments';
import Approvals from '@/pages/finance/Approvals';
import Reports from '@/pages/finance/Reports';
import ErpConnectors from '@/pages/admin/ErpConnectors';
import ErpSync from '@/pages/admin/ErpSync';
import UsersRoles from '@/pages/admin/UsersRoles';
import Settings from '@/pages/admin/Settings';
import MobileCollect from '@/pages/mobile/MobileCollect';
import MobileDriver from '@/pages/mobile/MobileDriver';
import MobileFarmer from '@/pages/mobile/MobileFarmer';

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
      </Route>

      <Route
        path="/mobile"
        element={
          <RequireAuth>
            <MobileShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="collect" replace />} />
        <Route path="collect" element={<MobileCollect />} />
        <Route path="driver" element={<MobileDriver />} />
        <Route path="farmer" element={<MobileFarmer />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
