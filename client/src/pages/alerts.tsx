import { Bell, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Alerts() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto p-4 pt-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Alerts</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Stay updated on rate changes and market trends.
          </p>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Bell className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No alerts yet
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            We'll notify you about rate changes and important updates for your saved properties.
          </p>
        </div>

        {/* Sample alert cards for visual reference */}
        <div className="space-y-3 opacity-40">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  Interest rates dropped
                </h3>
                <p className="text-sm text-muted-foreground">
                  Rates decreased by 0.25% in your area
                </p>
                <p className="text-xs text-muted-foreground mt-2">2 hours ago</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  Property value update
                </h3>
                <p className="text-sm text-muted-foreground">
                  Estimated value increased for 123 Dream Home Ave
                </p>
                <p className="text-xs text-muted-foreground mt-2">1 day ago</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
