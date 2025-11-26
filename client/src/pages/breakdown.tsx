import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Share2, 
  Home, 
  Percent, 
  Shield, 
  Building2, 
  Droplets,
  Umbrella,
  MoreHorizontal,
  Save,
  Edit,
  X,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { SavedCalculation } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface EditableValues {
  propertyTaxes: string;
  hoa: string;
  pmi: string;
  homeownersInsurance: string;
  floodInsurance: string;
  other: string;
}

export default function Breakdown() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localTotal, setLocalTotal] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<EditableValues>({
    propertyTaxes: "0",
    hoa: "0",
    pmi: "0",
    homeownersInsurance: "0",
    floodInsurance: "0",
    other: "0",
  });

  const { data: calculation, isLoading } = useQuery<SavedCalculation>({
    queryKey: ["/api/calculations", id],
    enabled: !!id,
  });

  // Safe parse function to handle null/undefined/invalid values
  const safeParseNumber = (value: unknown): string => {
    if (value === null || value === undefined) return "0.00";
    const num = parseFloat(String(value));
    if (isNaN(num)) return "0.00";
    return num.toFixed(2);
  };

  const safeParseFloat = (value: unknown): number => {
    if (value === null || value === undefined) return 0;
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  };

  // Initialize edit values when calculation loads
  useEffect(() => {
    if (calculation) {
      setEditValues({
        propertyTaxes: safeParseNumber(calculation.propertyTaxes),
        hoa: safeParseNumber(calculation.hoa),
        pmi: safeParseNumber(calculation.pmi),
        homeownersInsurance: safeParseNumber(calculation.homeownersInsurance),
        floodInsurance: safeParseNumber(calculation.floodInsurance),
        other: safeParseNumber(calculation.other),
      });
      setLocalTotal(null);
      setHasUnsavedChanges(false);
    }
  }, [calculation]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/calculations/${id}/save`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
      toast({
        title: "Calculation Saved",
        description: "This calculation has been saved to your profile.",
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
        description: error.message || "Unable to save calculation.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: EditableValues) => {
      const response = await apiRequest("PATCH", `/api/calculations/${id}`, {
        propertyTaxes: parseFloat(values.propertyTaxes) || 0,
        hoa: parseFloat(values.hoa) || 0,
        pmi: parseFloat(values.pmi) || 0,
        homeownersInsurance: parseFloat(values.homeownersInsurance) || 0,
        floodInsurance: parseFloat(values.floodInsurance) || 0,
        other: parseFloat(values.other) || 0,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculations", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
      setIsEditMode(false);
      setHasUnsavedChanges(false);
      setLocalTotal(null);
      toast({
        title: "Changes Saved",
        description: "Your calculation has been saved to the database.",
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
        description: error.message || "Unable to save calculation.",
        variant: "destructive",
      });
    },
  });

  const handleEditValueChange = (field: keyof EditableValues, value: string) => {
    // Allow only numbers and single decimal point
    let cleaned = value.replace(/[^0-9.]/g, "");
    // Only allow one decimal point
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + "." + parts[1].slice(0, 2);
    }
    setEditValues((prev) => ({ ...prev, [field]: cleaned }));
    setHasUnsavedChanges(true);
  };

  // Update Payment - recalculates locally without saving to database
  const handleUpdatePayment = () => {
    const newTotal = calculateEditTotal();
    setLocalTotal(newTotal);
    toast({
      title: "Payment Updated",
      description: `New monthly payment: ${formatCurrency(newTotal)}. Click "Save Changes" to persist.`,
    });
  };

  // Save Changes - actually persists to database
  const handleSaveChanges = () => {
    updateMutation.mutate(editValues);
  };

  const handleCancelEdit = () => {
    // Reset to original values
    if (calculation) {
      setEditValues({
        propertyTaxes: safeParseNumber(calculation.propertyTaxes),
        hoa: safeParseNumber(calculation.hoa),
        pmi: safeParseNumber(calculation.pmi),
        homeownersInsurance: safeParseNumber(calculation.homeownersInsurance),
        floodInsurance: safeParseNumber(calculation.floodInsurance),
        other: safeParseNumber(calculation.other),
      });
    }
    setIsEditMode(false);
    setHasUnsavedChanges(false);
    setLocalTotal(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-foreground mb-4">Calculation not found</p>
        <Button onClick={() => navigate("/")} data-testid="button-back-home">
          Go Home
        </Button>
      </div>
    );
  }

  // Non-editable components (Principal and Interest are calculated, not user-editable)
  const fixedComponents = [
    {
      icon: Home,
      label: "Principal",
      value: calculation.principal,
      color: "text-primary",
    },
    {
      icon: Percent,
      label: "Interest",
      value: calculation.interest,
      color: "text-chart-2",
    },
  ];

  // Editable components
  const editableComponents = [
    {
      icon: Building2,
      label: "Property Taxes",
      field: "propertyTaxes" as keyof EditableValues,
      value: calculation.propertyTaxes,
      color: "text-chart-3",
    },
    {
      icon: Building2,
      label: "HOA",
      field: "hoa" as keyof EditableValues,
      value: calculation.hoa,
      color: "text-chart-4",
    },
    {
      icon: Shield,
      label: "PMI",
      field: "pmi" as keyof EditableValues,
      value: calculation.pmi,
      color: "text-chart-5",
    },
    {
      icon: Umbrella,
      label: "Homeowners Insurance",
      field: "homeownersInsurance" as keyof EditableValues,
      value: calculation.homeownersInsurance,
      color: "text-primary",
    },
    {
      icon: Droplets,
      label: "Flood Insurance",
      field: "floodInsurance" as keyof EditableValues,
      value: calculation.floodInsurance,
      color: "text-chart-2",
    },
    {
      icon: MoreHorizontal,
      label: "Other",
      field: "other" as keyof EditableValues,
      value: calculation.other,
      color: "text-chart-3",
    },
  ];

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Calculate total from current edit values
  const calculateEditTotal = () => {
    const principal = safeParseFloat(calculation.principal);
    const interest = safeParseFloat(calculation.interest);
    const propertyTaxes = parseFloat(editValues.propertyTaxes) || 0;
    const hoa = parseFloat(editValues.hoa) || 0;
    const pmi = parseFloat(editValues.pmi) || 0;
    const homeownersInsurance = parseFloat(editValues.homeownersInsurance) || 0;
    const floodInsurance = parseFloat(editValues.floodInsurance) || 0;
    const other = parseFloat(editValues.other) || 0;
    return principal + interest + propertyTaxes + hoa + pmi + homeownersInsurance + floodInsurance + other;
  };

  // Calculate annual interest rate from monthly interest and loan amount
  const calculateInterestRate = () => {
    if (!calculation) return "0.00";
    const askingPrice = safeParseFloat(calculation.askingPrice);
    const downPayment = safeParseFloat(calculation.snapshotAmountDown);
    const loanAmount = askingPrice - downPayment;
    const monthlyInterest = safeParseFloat(calculation.interest);
    
    if (loanAmount <= 0) return "0.00";
    const annualRate = (monthlyInterest * 12 * 100) / loanAmount;
    return annualRate.toFixed(2);
  };

  const downPaymentAmount = safeParseFloat(calculation.snapshotAmountDown);
  const interestRate = calculateInterestRate();
  
  // Display total: use localTotal if set (after Update Payment), otherwise calculate live in edit mode
  const displayTotal = isEditMode 
    ? (localTotal !== null ? localTotal : calculateEditTotal())
    : safeParseFloat(calculation.totalMonthlyPayment);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {isEditMode ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelEdit}
              data-testid="button-cancel-edit"
            >
              <X className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="p-4 pt-6 space-y-6">
          {/* Title */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              {isEditMode ? "Edit Breakdown" : "Payment Breakdown"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditMode 
                ? "Adjust values and click 'Update Payment' to recalculate" 
                : "Your detailed monthly mortgage payment"}
            </p>
          </div>

          {/* Total Monthly Payment Card */}
          <Card className="p-6 bg-primary text-primary-foreground">
            <div className="space-y-1">
              <p className="text-sm opacity-90">Total Monthly Payment</p>
              <p className="text-5xl font-bold" data-testid="text-total-payment">
                {formatCurrency(displayTotal)}
              </p>
              {isEditMode && hasUnsavedChanges && (
                <p className="text-xs opacity-75">Click "Update Payment" to recalculate</p>
              )}
            </div>
          </Card>

          {/* Payment Components */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Payment Components</h2>
            
            <Card className="divide-y divide-border">
              {/* Fixed components (Principal & Interest - not editable) */}
              {fixedComponents.map((component) => (
                <div
                  key={component.label}
                  className="flex items-center justify-between p-4"
                  data-testid={`component-${component.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ${component.color}`}>
                      <component.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {component.label}
                    </span>
                  </div>
                  <span className="text-base font-semibold text-foreground">
                    {formatCurrency(component.value)}
                  </span>
                </div>
              ))}

              {/* Editable components */}
              {editableComponents.map((component) => (
                <div
                  key={component.label}
                  className={`flex items-center justify-between p-4 ${!isEditMode ? "hover-elevate" : ""}`}
                  data-testid={`component-${component.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ${component.color}`}>
                      <component.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {component.label}
                    </span>
                  </div>
                  {isEditMode ? (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={editValues[component.field]}
                        onChange={(e) => handleEditValueChange(component.field, e.target.value)}
                        className="w-24 h-9 text-right font-semibold"
                        data-testid={`input-${component.field}`}
                      />
                    </div>
                  ) : (
                    <span className="text-base font-semibold text-foreground">
                      {formatCurrency(component.value)}
                    </span>
                  )}
                </div>
              ))}
            </Card>
          </div>

          {/* Address Info */}
          {calculation.address && (
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Property Address</p>
              <p className="text-sm font-medium text-foreground">{calculation.address}</p>
            </Card>
          )}

          {/* Action Buttons - Not in edit mode */}
          {!isEditMode && (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 rounded-full"
                onClick={() => setIsEditMode(true)}
                data-testid="button-edit"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
              
              <div className="space-y-2">
                <Button
                  className="w-full h-14 text-base font-semibold rounded-full"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-calculation"
                >
                  {saveMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-5 w-5" />
                      Save Calculation
                    </span>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  with {formatCurrency(downPaymentAmount)} down payment at {interestRate}%
                </p>
              </div>
            </div>
          )}

          {/* Edit Mode Buttons */}
          {isEditMode && (
            <div className="space-y-3">
              {/* Update Payment - recalculates locally without saving */}
              <Button
                variant="outline"
                className="w-full h-12 rounded-full"
                onClick={handleUpdatePayment}
                data-testid="button-update-payment"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Payment
              </Button>

              {/* Save Changes - persists to database */}
              <Button
                className="w-full h-14 text-base font-semibold rounded-full"
                onClick={handleSaveChanges}
                disabled={updateMutation.isPending}
                data-testid="button-save-changes"
              >
                {updateMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-5 w-5" />
                    Save Changes
                  </span>
                )}
              </Button>

              {/* Cancel */}
              <Button
                variant="ghost"
                className="w-full h-10 rounded-full text-muted-foreground"
                onClick={handleCancelEdit}
                data-testid="button-cancel-edit-bottom"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
