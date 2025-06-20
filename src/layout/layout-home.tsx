import { Header } from "@/components/ui/header"
import { NavigationBar } from "@/components/ui/navigation-bar"
import { Home, Search, User,Bell } from "lucide-react"

import { useRouter } from 'next/router';

interface LayoutHomeProps {
  children: React.ReactNode
}

export function LayoutHome({ children }: LayoutHomeProps) {
    const tabs = [
        { id: "home", label: "Inicio", icon: Home, path: "/home" },
        { id: "search", label: "Buscar", icon: Search, path: "/search" },
        { id: "notifications", label: "Notificaciones", icon: Bell, path: "/notifications" },
        { id: "profile", label: "Perfil", icon: User, path: "/profile" },

    ]
    const router = useRouter();
    const getActiveTab = () => {
        if (router.pathname === "/home") {
            return "home";
        } else if (router.pathname === "/search") {
            return "search";
        } else if (router.pathname === "/favorites") {
            return "favorites";
        } else if (router.pathname === "/profile") {
            return "profile";
        }else if (router.pathname === "/notifications") {
            return "notifications";
        }
        return "home";
    }
    const handleTabsChange = (path: string) => {
        const tab = tabs.find(t => t.id === path);
        if (tab) {
          router.push(tab.path);
        }
    }
  return (
    <div>
      <Header notificationCount={0}/>
      {children}
      <NavigationBar tabs={tabs} activeTab={getActiveTab()} onTabsChange={handleTabsChange} />
    </div>
  )
}