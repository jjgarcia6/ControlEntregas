import { Navigate, Outlet } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";

interface ProtectedRouteProps {
  roles?: string[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.rol)) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Badge variant="destructive">
          Acceso denegado: no tienes permisos para esta sección
        </Badge>
      </div>
    );
  }

  return <Outlet />;
}
