import { Calculator, TrendingUp, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto p-4 pt-12 pb-24 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Powered by AI</span>
          </div>
          
          <h1 className="text-5xl font-bold text-foreground leading-tight">
            AI Mortgage<br />Calculator
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Get instant, accurate mortgage estimates powered by advanced AI technology
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <Card className="p-4 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Instant Calculations</h3>
              <p className="text-sm text-muted-foreground">
                Get detailed mortgage estimates in seconds, including taxes and insurance
              </p>
            </div>
          </Card>

          <Card className="p-4 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">AI-Powered Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Advanced AI analyzes property data and local tax rates for accuracy
              </p>
            </div>
          </Card>

          <Card className="p-4 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Save & Compare</h3>
              <p className="text-sm text-muted-foreground">
                Save calculations and compare multiple properties side by side
              </p>
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className="space-y-4 pt-4">
          <Button
            className="w-full h-14 text-base font-semibold rounded-full"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            Get Started
          </Button>
          
          <p className="text-center text-xs text-muted-foreground">
            Sign in to save your calculations and access your financial profile
          </p>
        </div>
      </div>
    </div>
  );
}
