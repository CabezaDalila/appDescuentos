import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavigationBarProps {
  activeTab?: string,
  tabs: {id: string, label: string, icon: LucideIcon, path: string}[],
  onTabsChange: (id: string) => void
}

export function NavigationBar({ tabs, activeTab, onTabsChange }: NavigationBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 safe-area-pb">
      <div className="flex justify-around">
        {tabs.map((tab) => {
          return (
            <Button
              key={tab.id}
              variant="ghost"
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                activeTab === tab.id ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => onTabsChange(tab.id)}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}