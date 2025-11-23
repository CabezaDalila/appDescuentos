import { NavigationBar } from "@/components/home/navigation-bar";
import { Bell, Home, LogOut, Search, Shield, User } from "lucide-react";

import { Button } from "@/components/Share/button";
import { ScrollArea } from "@/components/Share/scroll-area";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface LayoutHomeProps {
  children: React.ReactNode;
}

export function LayoutHome({ children }: LayoutHomeProps) {
  const [activeTab, setActiveTab] = useState<string>("home");
  const { isAdmin } = useAdmin();
  const { user, logout, loggingOut } = useAuth();
  const tabs = [
    { id: "home", label: "Inicio", icon: Home, path: "/home" },
    { id: "search", label: "Buscar", icon: Search, path: "/search" },
    {
      id: "notifications",
      label: "Notificaciones",
      icon: Bell,
      path: "/notifications",
    },
    { id: "profile", label: "Perfil", icon: User, path: "/profile" },
  ];
  const router = useRouter();

  const getActiveTabFromPath = () => {
    if (router.pathname === "/home") {
      return "home";
    } else if (router.pathname === "/search") {
      return "search";
    } else if (router.pathname === "/favorites") {
      return "favorites";
    } else if (
      router.pathname === "/profile" ||
      router.pathname.startsWith("/profile/") ||
      router.pathname.startsWith("/memberships") ||
      router.pathname.startsWith("/support")
    ) {
      return "profile";
    } else if (router.pathname === "/notifications") {
      return "notifications";
    }
    return "home";
  };

  // Sincronizar el estado local con la ruta cuando cambie
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [router.pathname]);

  const handleTabsChange = (tabId: string) => {
    // Actualizar inmediatamente el estado local
    setActiveTab(tabId);

    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      router.push(tab.path);
    }
  };

  const footer = isAdmin ? (
    <div className="space-y-4">
      <div className="px-2 xl:px-4 pt-4">
        <button
          className="w-full flex items-center gap-3 h-auto py-3 px-3 rounded-lg transition-colors text-purple-600 hover:bg-purple-50"
          onClick={() => router.push("/admin")}
          title="Panel Admin"
        >
          <Shield className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium hidden xl:inline">Panel Admin</span>
          <span className="sr-only xl:hidden">Panel Admin</span>
        </button>
      </div>
      <div className="px-2 xl:px-4">
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
            {loggingOut ? "Cerrando..." : "Cerrar Sesión"}
          </span>
        </Button>
      </div>
    </div>
  ) : null;

  // Para páginas que tienen su propio layout (perfil, membresías, notificaciones, soporte)
  if (
    router.pathname === "/profile" ||
    router.pathname.startsWith("/profile/") ||
    router.pathname.startsWith("/memberships") ||
    router.pathname.startsWith("/support") ||
    router.pathname === "/notifications"
  ) {
    return (
      <div className="h-screen flex flex-col safe-area-insets">
        <div className="flex-1 overflow-y-auto lg:ml-16 xl:ml-64 pb-20 lg:pb-0">
          {children}
        </div>
        <NavigationBar
          tabs={tabs}
          activeTab={activeTab}
          onTabsChange={handleTabsChange}
          footer={footer}
        />
      </div>
    );
  }

  // Para la página de home - sin Header
  if (router.pathname === "/home") {
    return (
      <div className="h-screen flex flex-col safe-area-insets">
        <div className="flex-1 overflow-hidden lg:ml-16 xl:ml-64">
          <main className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto">
            <ScrollArea className="h-screen lg:max-h-none">
              {children}
            </ScrollArea>
          </main>
        </div>
        <NavigationBar
          tabs={tabs}
          activeTab={activeTab}
          onTabsChange={handleTabsChange}
          footer={footer}
        />
      </div>
    );
  }

  // Para páginas que necesitan el layout con ScrollArea (search, etc.)
  return (
    <div className="h-screen flex flex-col safe-area-insets">
      <div className="flex-1 overflow-hidden lg:ml-16 xl:ml-64">
        <main className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto">
          <ScrollArea className="h-screen lg:max-h-none">{children}</ScrollArea>
        </main>
      </div>
      <NavigationBar
        tabs={tabs}
        activeTab={activeTab}
        onTabsChange={handleTabsChange}
        footer={footer}
      />
    </div>
  );
}
