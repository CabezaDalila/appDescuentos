import { Card, CardContent } from "@/components/Share/card";
import { Gift } from "lucide-react";

interface DiscountsEmptyStateProps {
  message: string;
  subtitle?: string;
}

export function DiscountsEmptyState({
  message,
  subtitle,
}: DiscountsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Gift className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center">
          {message}
          {subtitle && (
            <>
              <br />
              {subtitle}
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
