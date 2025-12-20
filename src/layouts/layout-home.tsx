import { NavigationBar } from "@/components/home/navigation-bar";
import { Bell, Home, Search, Shield, User } from "lucide-react";

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

  // Sincronizar el estado local con la ruta cuando cambie
  useEffect(() => {
    const path = router.pathname;

    if (path === "/home") {
      setActiveTab("home");
    } else if (path === "/search") {
      setActiveTab("search");
    } else if (path === "/notifications") {
      setActiveTab("notifications");
    } else if (
      path === "/profile" ||
      path.startsWith("/profile/") ||
      path.startsWith("/memberships") ||
      path.startsWith("/support") ||
      path.startsWith("/privacy")
    ) {
      setActiveTab("profile");
    } else {
      setActiveTab("home");
    }
  }, [router.pathname]);

  const handleTabsChange = (tabId: string) => {
    // Actualizar inmediatamente el estado local
    setActiveTab(tabId);

    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      router.push(tab.path);
    }
  };

  const adminFooterConfig = isAdmin
    ? {
        ctaButton: {
          label: "Panel Admin",
          icon: Shield,
          onClick: () => router.push("/admin"),
        },
        userEmail: user?.email,
        onLogout: logout,
        loggingOut,
      }
    : undefined;

  return (
    <div className="h-screen flex flex-col safe-area-insets">
      <div className="flex-1 overflow-hidden lg:ml-16 xl:ml-64">
        <main className="w-full max-w-2xl lg:max-w-none lg:w-full mx-auto">
          <ScrollArea className="h-screen lg:max-h-none">{children}</ScrollArea>
        </main>
      </div>
      <NavigationBar
        tabs={tabs}
        activeTab={activeTab}
        onTabsChange={handleTabsChange}
        adminFooter={adminFooterConfig}
      />
    </div>
  );
}
