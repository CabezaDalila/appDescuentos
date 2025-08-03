import { Header } from "@/components/layout/header"
import { NavigationBar } from "@/components/layout/navigation-bar"
import { Home, Search, User,Bell } from "lucide-react"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router';

interface LayoutHomeProps {
  children: React.ReactNode
}

export function LayoutHome({ children }: LayoutHomeProps) {
    const [activeTab, setActiveTab] = useState<string>("home");
    const tabs = [
        { id: "home", label: "Inicio", icon: Home, path: "/home" },
        { id: "search", label: "Buscar", icon: Search, path: "/search" },
        { id: "notifications", label: "Notificaciones", icon: Bell, path: "/notifications" },
        { id: "profile", label: "Perfil", icon: User, path: "/profile" },

    ]
    const router = useRouter();
    
    const getActiveTabFromPath = () => {
        if (router.pathname === "/home") {
            return "home";
        } else if (router.pathname === "/search") {
            return "search";
        } else if (router.pathname === "/favorites") {
            return "favorites";
        } else if (router.pathname === "/profile" || router.pathname.startsWith("/memberships")) {
            return "profile";
        } else if (router.pathname === "/notifications") {
            return "notifications";
        }
        return "home";
    }

    // Sincronizar el estado local con la ruta cuando cambie
    useEffect(() => {
        setActiveTab(getActiveTabFromPath());
    }, [router.pathname]);

    const handleTabsChange = (tabId: string) => {
        // Actualizar inmediatamente el estado local
        setActiveTab(tabId);
        
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
          router.push(tab.path);
        }
    }
  return (
    <div>
      {router.pathname !== "/profile" && router.pathname !== "/memberships" && <Header notificationCount={0}/>} 
      {children}
      <NavigationBar tabs={tabs} activeTab={activeTab} onTabsChange={handleTabsChange} />
    </div>
  )
}