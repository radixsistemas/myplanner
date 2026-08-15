import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../stores/auth-store";
import { FullPageSpinner } from "../ui/Spinner";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
