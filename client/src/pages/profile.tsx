import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { financialProfileFormSchema, type FinancialProfileFormData, type FinancialProfile } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: profile } = useQuery<FinancialProfile>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const form = useForm<FinancialProfileFormData>({
    resolver: zodResolver(financialProfileFormSchema),
    defaultValues: {
      userId: "",
      age: undefined,
      annualIncome: "",
      creditScore: 720,
      amountDown: "",
      mortgageType: "",
      monthlyDebt: "",
      homesteadExemption: false,
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        userId: profile.userId,
        age: profile.age ?? undefined,
        annualIncome: profile.annualIncome ?? "",
        creditScore: profile.creditScore ?? 720,
        amountDown: profile.amountDown ?? "",
        mortgageType: profile.mortgageType ?? "",
        monthlyDebt: profile.monthlyDebt ?? "",
        homesteadExemption: profile.homesteadExemption ?? false,
      });
    }
  }, [profile, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FinancialProfileFormData) => {
      await apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile Saved",
        description: "Your financial profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Save Failed",
        description: error.message || "Unable to save profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const creditScore = form.watch("creditScore");
  const homesteadExemption = form.watch("homesteadExemption");

  const onSubmit = (data: FinancialProfileFormData) => {
    saveMutation.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto p-4 pt-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Your Financial<br />Profile
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Help us understand your financial situation to calculate accurate mortgage options.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Age */}
          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-medium text-foreground">
              Age
            </Label>
            <Input
              id="age"
              data-testid="input-age"
              type="number"
              placeholder="e.g. 35"
              className="h-14 text-base"
              {...form.register("age", { valueAsNumber: true })}
            />
          </div>

          {/* Annual Income */}
          <div className="space-y-2">
            <Label htmlFor="annualIncome" className="text-sm font-medium text-foreground">
              Annual Income
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="annualIncome"
                data-testid="input-annual-income"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7 h-14 text-base"
                {...form.register("annualIncome")}
              />
            </div>
          </div>

          {/* Credit Score */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Estimated Credit Score
            </Label>
            <div className="space-y-2">
              <div className="px-4 py-3 bg-muted/50 rounded-md">
                <div className="text-2xl font-bold text-foreground" data-testid="text-credit-score">
                  {creditScore}
                </div>
              </div>
              <Slider
                data-testid="slider-credit-score"
                value={[creditScore ?? 720]}
                onValueChange={(value) => form.setValue("creditScore", value[0])}
                min={300}
                max={850}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>300</span>
                <span className="text-xs">Range: 300-850</span>
                <span>850</span>
              </div>
            </div>
          </div>

          {/* Amount Down */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amountDown" className="text-sm font-medium text-foreground">
                Amount Down
              </Label>
              <span className="text-xs text-muted-foreground">(5.5%)</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amountDown"
                data-testid="input-amount-down"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7 h-14 text-base"
                {...form.register("amountDown")}
              />
            </div>
          </div>

          {/* Homestead Exemption */}
          <div className="flex items-center space-x-3 py-2">
            <Checkbox
              id="homesteadExemption"
              data-testid="checkbox-homestead"
              checked={homesteadExemption}
              onCheckedChange={(checked) => form.setValue("homesteadExemption", !!checked)}
            />
            <Label
              htmlFor="homesteadExemption"
              className="text-sm text-foreground cursor-pointer"
            >
              I will be taking the homestead exemption
            </Label>
          </div>

          {/* Mortgage Type */}
          <div className="space-y-2">
            <Label htmlFor="mortgageType" className="text-sm font-medium text-foreground">
              Mortgage Type
            </Label>
            <Select
              value={form.watch("mortgageType") || ""}
              onValueChange={(value) => form.setValue("mortgageType", value)}
            >
              <SelectTrigger
                id="mortgageType"
                data-testid="select-mortgage-type"
                className="h-14 text-base"
              >
                <SelectValue placeholder="Select mortgage type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30-year-fixed" data-testid="option-30-year">30-Year Fixed</SelectItem>
                <SelectItem value="15-year-fixed" data-testid="option-15-year">15-Year Fixed</SelectItem>
                <SelectItem value="arm" data-testid="option-arm">ARM (Adjustable Rate)</SelectItem>
                <SelectItem value="fha" data-testid="option-fha">FHA Loan</SelectItem>
                <SelectItem value="va" data-testid="option-va">VA Loan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Monthly Debt */}
          <div className="space-y-2">
            <Label htmlFor="monthlyDebt" className="text-sm font-medium text-foreground">
              Estimated Monthly Debt
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="monthlyDebt"
                data-testid="input-monthly-debt"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7 h-14 text-base"
                {...form.register("monthlyDebt")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Include car payments, credit cards, student loans, etc.
            </p>
          </div>

          {/* Save Button */}
          <Button
            type="submit"
            className="w-full h-14 text-base font-semibold rounded-full"
            disabled={saveMutation.isPending}
            data-testid="button-save-profile"
          >
            {saveMutation.isPending ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Save & Continue
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
