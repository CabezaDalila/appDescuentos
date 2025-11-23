import { Button } from "@/components/Share/button";
import { Gift, LogOut, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface AdminFooterConfig {
  ctaButton: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
  };
  userEmail?: string | null;
  onLogout: () => void;
  loggingOut: boolean;
}

interface NavigationBarProps {
  activeTab?: string;
  tabs: { id: string; label: string; icon: LucideIcon; path: string }[];
  onTabsChange: (id: string) => void;
  header?: ReactNode;
  footer?: ReactNode;
  title?: string;
  hideMobile?: boolean;
  adminFooter?: AdminFooterConfig;
}

export function NavigationBar({
  tabs,
  activeTab,
  onTabsChange,
  header,
  footer,
  title,
  hideMobile = false,
  adminFooter,
}: NavigationBarProps) {
  // Render admin footer if config is provided
  const renderAdminFooter = () => {
    if (!adminFooter) return null;

    return (
      <div className="space-y-4">
        <div className="px-2 xl:px-4 pt-4">
          <button
            className="w-full flex items-center gap-3 h-auto py-3 px-3 rounded-lg transition-colors text-purple-600 hover:bg-purple-50"
            onClick={adminFooter.ctaButton.onClick}
            title={adminFooter.ctaButton.label}
          >
            <adminFooter.ctaButton.icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium hidden xl:inline">
              {adminFooter.ctaButton.label}
            </span>
            <span className="sr-only xl:hidden">{adminFooter.ctaButton.label}</span>
          </button>
        </div>
        <div className="px-2 xl:px-4">
          <div className="flex items-center justify-center xl:justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {adminFooter.userEmail?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="xl:ml-3 flex-1 min-w-0 hidden xl:block">
              <p className="text-sm font-medium text-gray-700 truncate">
                {adminFooter.userEmail}
              </p>
              <p className="text-xs text-gray-600">Administrador</p>
            </div>
          </div>
        </div>
        <div className="px-2 xl:px-4 pb-4">
          <Button
            variant="outline"
            onClick={adminFooter.onLogout}
            disabled={adminFooter.loggingOut}
            className="w-full justify-center xl:justify-start text-gray-700 hover:text-gray-900 border-gray-300"
          >
            <LogOut className="h-4 w-4 xl:mr-2" />
            <span className="hidden xl:inline">
              {adminFooter.loggingOut ? "Cerrando..." : "Cerrar Sesión"}
            </span>
          </Button>
        </div>
      </div>
    );
  };

  const footerContent = adminFooter ? renderAdminFooter() : footer;
  return (
    <>
      {/* Mobile Navigation - Bottom */}
      {!hideMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50 lg:hidden">
          <div className="flex justify-around max-w-2xl mx-auto p-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`flex flex-col items-center justify-center gap-0 h-auto py-1.5 sm:py-2 px-2 sm:px-3 rounded-md transition-colors min-h-[44px] ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-accent-foreground hover:bg-accent/50"
                  }`}
                  onClick={() => onTabsChange(tab.id)}
                >
                  <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  {/* Ocultamos el texto en mobile para dejar solo iconos */}
                  <span className="sr-only">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Desktop Navigation - Wide Sidebar (1250px and above) */}
      <div className="hidden xl:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-30 safe-area-pt">
        <div className="flex flex-col h-full">
          {/* Header */}
          {header ? (
            <div className="flex-shrink-0 pt-5 pb-4 px-4 border-b border-gray-200">
              {header}
            </div>
          ) : (
            <div className="flex-shrink-0 pt-20 px-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
          )}

          {/* Navigation Items */}
          <div className="flex-1 px-2 py-4 overflow-y-auto">
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

          {/* Footer */}
          {footerContent && (
            <div className="flex-shrink-0 border-t border-gray-200">
              {footerContent}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Navigation - Compact Sidebar (1024px to 1250px) */}
      <div className="hidden lg:block xl:hidden fixed left-0 top-0 h-full w-16 bg-white border-r border-gray-200 z-30 safe-area-pt">
        <div className="flex flex-col h-full">
          {/* Header compacto */}
          {header && (
            <div className="flex-shrink-0 pt-5 pb-4 px-2 border-b border-gray-200 flex justify-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Gift className="h-5 w-5 text-white" />
              </div>
            </div>
          )}

          <div className="flex-1 px-2 py-4 overflow-y-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`w-full flex flex-col items-center justify-center gap-0 h-auto py-3 px-2 rounded-lg transition-colors mb-1 ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-accent-foreground hover:bg-accent/50"
                  }`}
                  onClick={() => onTabsChange(tab.id)}
                  title={tab.label}
                >
                  <tab.icon className="h-5 w-5 flex-shrink-0" />
                  {/* Ocultamos el texto en modo compacto para evitar solapamientos */}
                  <span className="sr-only">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Footer compacto */}
          {footerContent && (
            <div className="flex-shrink-0 border-t border-gray-200 px-2 py-4">
              {footerContent}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
