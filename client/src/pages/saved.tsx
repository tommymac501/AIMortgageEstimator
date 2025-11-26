import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Home as HomeIcon, Calendar, MapPin, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { SavedCalculation } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Saved() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const { data: calculations, isLoading } = useQuery<SavedCalculation[]>({
    queryKey: ["/api/calculations"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (calcId: string) => {
      await apiRequest("DELETE", `/api/calculations/${calcId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
      toast({
        title: "Calculation Deleted",
        description: "The saved calculation has been removed.",
      });
      setDeletingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Unable to delete calculation.",
        variant: "destructive",
      });
      setDeletingId(null);
    },
  });

  const handleDelete = (e: React.MouseEvent, calcId: string) => {
    e.stopPropagation();
    setDeletingId(calcId);
    deleteMutation.mutate(calcId);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  if (authLoading || isLoading) {
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
          <h1 className="text-3xl font-bold text-foreground">Saved Calculations</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            View and manage your mortgage calculations.
          </p>
        </div>

        {/* Calculations List */}
        {!calculations || calculations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <HomeIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No saved calculations
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
              Calculate a mortgage and save it to see it here.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="rounded-full"
              data-testid="button-go-home"
            >
              Calculate Mortgage
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {calculations.map((calc) => (
              <Card
                key={calc.id}
                className="p-0 overflow-hidden hover-elevate cursor-pointer"
                onClick={() => navigate(`/breakdown/${calc.id}`)}
                data-testid={`card-calculation-${calc.id}`}
              >
                <div className="flex gap-3 p-4">
                  {/* Photo Thumbnail */}
                  <div className="flex-shrink-0">
                    {calc.propertyPhotoUrl ? (
                      <img
                        src={calc.propertyPhotoUrl}
                        alt={calc.address}
                        className="w-20 h-20 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-md bg-muted/50 flex items-center justify-center">
                        <HomeIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {calc.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {formatDate(calc.createdAt!)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-1">
                      <p className="text-xs text-muted-foreground">Total Monthly Payment</p>
                      <p className="text-xl font-bold text-primary" data-testid={`payment-${calc.id}`}>
                        {formatCurrency(calc.totalMonthlyPayment)}
                      </p>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, calc.id)}
                      disabled={deletingId === calc.id}
                      data-testid={`button-delete-${calc.id}`}
                    >
                      {deletingId === calc.id ? (
                        <div className="h-4 w-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
