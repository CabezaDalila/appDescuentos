import { LucideIcon } from "lucide-react";

interface NavigationBarProps {
  activeTab?: string;
  tabs: { id: string; label: string; icon: LucideIcon; path: string }[];
  onTabsChange: (id: string) => void;
}

export function NavigationBar({
  tabs,
  activeTab,
  onTabsChange,
}: NavigationBarProps) {
  return (
    <>
      {/* Mobile Navigation - Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-30 lg:hidden">
        <div className="flex justify-around max-w-2xl mx-auto p-2">
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
                <span className="text-[10px] sm:text-xs font-medium leading-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Navigation - Wide Sidebar (1250px and above) */}
      <div className="hidden xl:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-30">
        <div className="flex flex-col h-full pt-20">
          <div className="px-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Navegación</h2>
          </div>
          <div className="flex-1 px-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`w-full flex items-center gap-3 h-auto py-3 px-3 rounded-lg transition-colors mb-1 ${
                    isActive
                      ? "text-primary bg-primary/10 border-r-2 border-primary"
                      : "text-muted-foreground hover:text-accent-foreground hover:bg-accent/50"
                  }`}
                  onClick={() => onTabsChange(tab.id)}
                >
                  <tab.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Navigation - Compact Sidebar (1024px to 1250px) */}
      <div className="hidden lg:block xl:hidden fixed left-0 top-0 h-full w-16 bg-white border-r border-gray-200 z-30">
        <div className="flex flex-col h-full pt-20">
          <div className="flex-1 px-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`w-full flex flex-col items-center gap-1 h-auto py-3 px-2 rounded-lg transition-colors mb-1 ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-accent-foreground hover:bg-accent/50"
                  }`}
                  onClick={() => onTabsChange(tab.id)}
                  title={tab.label}
                >
                  <tab.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-[10px] font-medium text-center leading-tight">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
