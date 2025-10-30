import { Bell } from "lucide-react";

interface HeaderProps {
  greeting: string;
  notificationCount: number;
  onNotificationClick: () => void;
}

export function Header({
  greeting,
  notificationCount,
  onNotificationClick,
}: HeaderProps) {
  return (
    <div className="w-full px-3 sm:px-4 lg:px-4 xl:px-6 2xl:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4">
      <div className="flex items-center justify-between  sm:mb-4">
        <div className="min-w-0 text-left">
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            {greeting}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 hidden lg:block">
            Descubre las mejores ofertas y descuentos
          </p>
        </div>
        <div className="flex items-center">
          <button
            onClick={onNotificationClick}
            className="relative p-1.5 sm:p-2 lg:p-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-gray-600" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs lg:text-sm rounded-full w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 flex items-center justify-center font-medium">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
