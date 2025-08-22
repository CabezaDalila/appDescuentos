import { Header } from "@/components/layout/header"
import { NavigationBar } from "@/components/layout/navigation-bar"
import { Home, Search, User,Bell } from "lucide-react"
import { useRouter } from 'next/router';
import { ScrollArea } from "@/components/Share/scroll-area"

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
        } else if (router.pathname === "/profile" || router.pathname.startsWith("/memberships")) {
            return "profile";
        } else if (router.pathname === "/notifications") {
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
    <div className="min-h-screen bg-gray-50">
      {router.pathname !== "/profile" && router.pathname !== "/memberships" && <Header />} 
      <main className="container mx-auto px-4 py-1 max-w-2xl">
        <ScrollArea className="h-[calc(100vh-100px)]">
          {children}
        </ScrollArea>
      </main>
      <NavigationBar tabs={tabs} activeTab={getActiveTab()} onTabsChange={handleTabsChange} />
    </div>
  )
}