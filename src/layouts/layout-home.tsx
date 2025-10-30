import { NavigationBar } from "@/components/home/navigation-bar";
import { Bell, Home, Search, User } from "lucide-react";

import { ScrollArea } from "@/components/Share/scroll-area";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface LayoutHomeProps {
  children: React.ReactNode;
}

export function LayoutHome({ children }: LayoutHomeProps) {
  const [activeTab, setActiveTab] = useState<string>("home");
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
      router.pathname.startsWith("/memberships")
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

  // Para páginas que tienen su propio layout (perfil, membresías, notificaciones)
  if (
    router.pathname === "/profile" ||
    router.pathname.startsWith("/memberships") ||
    router.pathname === "/notifications"
  ) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto lg:ml-16 xl:ml-64">
          {children}
        </div>
        <NavigationBar
          tabs={tabs}
          activeTab={activeTab}
          onTabsChange={handleTabsChange}
        />
      </div>
    );
  }

  // Para la página de home - sin Header
  if (router.pathname === "/home") {
    return (
      <div className="h-screen flex flex-col">
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
        />
      </div>
    );
  }

  // Para páginas que necesitan el layout con ScrollArea (search, etc.)
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden lg:ml-16 xl:ml-64">
        <main className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto">
          <ScrollArea className="h-screen lg:max-h-none">{children}</ScrollArea>
        </main>
      </div>
      <NavigationBar
        tabs={tabs}
        activeTab={activeTab}
        onTabsChange={handleTabsChange}
      />
    </div>
  );
}
