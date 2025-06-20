import { Header } from "@/components/ui/header"
import { NavigationBar } from "@/components/ui/navigation-bar"
import { Home, Search, Heart, User } from "lucide-react"
import { useRouter } from 'next/router';

interface LayoutHomeProps {
  children: React.ReactNode
}

export function LayoutHome({ children }: LayoutHomeProps) {
    const tabs = [
        { id: "home", label: "Inicio", icon: Home, path: "/home" },
        { id: "search", label: "Buscar", icon: Search, path: "/search" },
        { id: "favorites", label: "Favoritos", icon: Heart, path: "/favorites" },
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
      <Header notificationCount={3} />
      {children}
      <NavigationBar tabs={tabs} activeTab={getActiveTab()} onTabsChange={handleTabsChange} />
    </div>
  )
}