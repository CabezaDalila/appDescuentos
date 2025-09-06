import { Header } from "@/components/home/header";
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
        <div className="flex-1 overflow-hidden">{children}</div>
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
        <div className="flex-1 overflow-hidden">
          <main className="w-full max-w-2xl mx-auto">
            <ScrollArea className="h-[calc(100vh-80px)]">{children}</ScrollArea>
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
      <Header />
      <div className="flex-1 overflow-hidden">
        <main className="w-full max-w-2xl mx-auto">
          <ScrollArea className="h-[calc(100vh-100px)]">{children}</ScrollArea>
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
