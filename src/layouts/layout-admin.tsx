import { NavigationBar } from "@/components/home/navigation-bar";
import { Button } from "@/components/Share/button";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3,
  Bell,
  Gift,
  Home,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface LayoutAdminProps {
  children: React.ReactNode;
}

export function LayoutAdmin({ children }: LayoutAdminProps) {
  const router = useRouter();
  const { logout, user, loggingOut } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const tabs = [
    {
      id: "dashboard",
      label: "Panel Principal",
      icon: BarChart3,
      path: "/admin",
    },
    {
      id: "discounts",
      label: "Descuentos",
      icon: Gift,
      path: "/admin/discounts",
    },
    {
      id: "scripts",
      label: "Scripts",
      icon: Settings,
      path: "/admin/scripts",
    },
    {
      id: "notifications",
      label: "Notificaciones",
      icon: Bell,
      path: "/admin/notifications",
    },
    {
      id: "users",
      label: "Usuarios",
      icon: Users,
      path: "/admin/users",
    },
  ];

  useEffect(() => {
    const getActiveTabFromPath = () => {
      if (router.pathname === "/admin") {
        return "dashboard";
      } else if (
        router.pathname.startsWith("/admin/discounts") ||
        router.pathname.startsWith("/admin/approvals")
      ) {
        return "discounts";
      } else if (router.pathname.startsWith("/admin/scripts")) {
        return "scripts";
      } else if (router.pathname.startsWith("/admin/notifications")) {
        return "notifications";
      } else if (router.pathname.startsWith("/admin/users")) {
        return "users";
      }
      return "dashboard";
    };
    setActiveTab(getActiveTabFromPath());
  }, [router.pathname]);

  const handleTabsChange = (tabId: string) => {
    setActiveTab(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      router.push(tab.path);
    }
  };

  const header = (
    <div className="flex items-center">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <Gift className="h-5 w-5 text-white" />
      </div>
      <span className="ml-3 text-xl font-bold text-gray-900">Admin Panel</span>
    </div>
  );

  const footer = (
    <div className="space-y-4">
      <div className="px-2 xl:px-4 pt-4">
        <div className="flex items-center justify-center xl:justify-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="xl:ml-3 flex-1 min-w-0 hidden xl:block">
            <p className="text-sm font-medium text-gray-700 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-gray-600">Administrador</p>
          </div>
        </div>
      </div>
      <div className="px-2 xl:px-4 pb-4">
        <Button
          variant="outline"
          onClick={logout}
          disabled={loggingOut}
          className="w-full justify-center xl:justify-start text-gray-700 hover:text-gray-900 border-gray-300"
        >
          <LogOut className="h-4 w-4 xl:mr-2" />
          <span className="hidden xl:inline">
            {loggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}
          </span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 flex admin-layout">
      {/* Navigation Bar - Reutilizada del usuario (solo desktop) */}
      <NavigationBar
        tabs={tabs}
        activeTab={activeTab}
        onTabsChange={handleTabsChange}
        header={header}
        footer={footer}
        hideMobile={true}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-16 xl:ml-64">
        {/* Top bar - Solo visible en desktop */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:px-6 lg:py-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Panel de Administración
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push("/home")}
              className="flex items-center text-gray-700 hover:text-gray-900"
            >
              <Home className="h-4 w-4 mr-2" />
              Ver como Usuario
            </Button>
          </div>
        </div>

        {/* Mobile warning */}
        <div className="lg:hidden bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Panel de Administración:</strong> Este panel está
                optimizado para pantallas de escritorio. Para una mejor
                experiencia, accede desde una computadora.
              </p>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 admin-main-content overflow-y-auto">
          <div className="py-6 admin-content-wrapper">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
