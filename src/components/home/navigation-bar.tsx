import { LucideIcon } from "lucide-react"

interface NavigationBarProps {
  activeTab?: string,
  tabs: {id: string, label: string, icon: LucideIcon, path: string}[],
  onTabsChange: (id: string) => void
}

export function NavigationBar({ tabs, activeTab, onTabsChange }: NavigationBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 sm:px-4 pb-1.5 sm:pb-2 safe-area-pb z-30">
      <div className="flex justify-around max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`flex flex-col items-center gap-0.5 sm:gap-1 h-auto py-1.5 sm:py-2 px-2 sm:px-3 rounded-md transition-colors min-h-[44px] ${
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-accent-foreground hover:bg-accent/50"
              }`}
              onClick={() => onTabsChange(tab.id)}
            >
              <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-xs font-medium leading-tight">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}