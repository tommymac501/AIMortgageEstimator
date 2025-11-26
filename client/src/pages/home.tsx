import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MapPin, DollarSign, Camera, Calculator, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { mortgageCalculationFormSchema, type MortgageCalculationFormData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [showPasteButton, setShowPasteButton] = useState(false);

  // Fetch user profile to check if it's complete
  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
  });

  const form = useForm<MortgageCalculationFormData>({
    resolver: zodResolver(mortgageCalculationFormSchema),
    defaultValues: {
      address: "",
      askingPrice: "",
      propertyPhotoUrl: "",
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: MortgageCalculationFormData) => {
      const response = await apiRequest("POST", "/api/calculate-mortgage", data);
      return response;
    },
    onSuccess: (result) => {
      navigate(`/breakdown/${result.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Calculation Failed",
        description: error.message || "Unable to calculate mortgage. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            setPhotoPreview(result);
            form.setValue("propertyPhotoUrl", result);
            setShowPasteButton(false);
          };
          reader.readAsDataURL(blob);
        }
        break;
      }
    }
  };

  const triggerPaste = async () => {
    try {
      const imageData = await navigator.clipboard.read();
      for (const item of imageData) {
        if (item.type.startsWith("image/")) {
          const blob = await item.getType(item.type);
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            setPhotoPreview(result);
            form.setValue("propertyPhotoUrl", result);
            setShowPasteButton(false);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    } catch (err) {
      toast({
        title: "Paste Failed",
        description: "No image found in clipboard",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: MortgageCalculationFormData) => {
    // Check if profile is complete (has key fields)
    const hasCompleteProfile = profile && 
      profile.creditScore && 
      profile.amountDown && 
      profile.mortgageType;

    if (!hasCompleteProfile) {
      toast({
        title: "Complete Your Profile",
        description: "Please set up your financial profile before calculating mortgages.",
        variant: "default",
      });
      navigate("/profile");
      return;
    }

    calculateMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto p-4 pt-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 hover:bg-primary/20">
              <span className="text-xs font-medium">AI Powered</span>
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            AI Mortgage<br />Calculator
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Enter property details below to get an instant AI-driven mortgage estimate.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Property Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium text-foreground">
              Property Address
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="address"
                data-testid="input-address"
                placeholder="e.g. 123 Dream Home Ave"
                className="pl-10 h-14 text-base"
                {...form.register("address")}
              />
            </div>
            {form.formState.errors.address && (
              <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>

          {/* Asking Price */}
          <div className="space-y-2">
            <Label htmlFor="askingPrice" className="text-sm font-medium text-foreground">
              Asking Price
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="askingPrice"
                data-testid="input-asking-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-10 h-14 text-base"
                {...form.register("askingPrice")}
              />
            </div>
            {form.formState.errors.askingPrice && (
              <p className="text-sm text-destructive">{form.formState.errors.askingPrice.message}</p>
            )}
          </div>

          {/* Property Photo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Property Photo <span className="text-muted-foreground font-normal">Optional</span>
            </Label>
            <Card 
              className="p-6 border-2 border-dashed border-border hover-elevate cursor-pointer"
              onPaste={handlePaste}
              onClick={() => setShowPasteButton(!showPasteButton)}
              data-testid="card-photo-paste"
            >
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Property preview"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPhotoPreview("");
                      form.setValue("propertyPhotoUrl", "");
                      setShowPasteButton(false);
                    }}
                    data-testid="button-clear-photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : showPasteButton ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                  <p className="text-sm font-medium text-foreground">Ready to paste</p>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      triggerPaste();
                    }}
                    data-testid="button-paste-photo"
                  >
                    Paste from Clipboard
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Click to paste photo</p>
                  <p className="text-xs text-muted-foreground">Cmd+V or Ctrl+V</p>
                </div>
              )}
            </Card>
          </div>

          {/* Calculate Button */}
          <Button
            type="submit"
            className="w-full h-14 text-base font-semibold rounded-full"
            disabled={calculateMutation.isPending}
            data-testid="button-calculate"
          >
            {calculateMutation.isPending ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Calculating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculate Mortgage
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
