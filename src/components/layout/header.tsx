import { Bell } from "lucide-react"
import { Button } from "@/components/Share/button"
import { Badge } from "@/components/Share/badge"

interface HeaderProps {
  notificationCount?: number
}

export function Header({ notificationCount = 0 }: HeaderProps) {
  return (
    <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-foreground">Logo</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {notificationCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}