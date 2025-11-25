import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { calculateMortgageWithAI } from "./openai";
import { 
  financialProfileFormSchema,
  mortgageCalculationFormSchema,
  type InsertSavedCalculation,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Return null if not authenticated
      if (!req.isAuthenticated()) {
        return res.json(null);
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Financial Profile routes
  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getFinancialProfile(userId);
      
      if (!profile) {
        // Return empty profile structure
        return res.json({
          userId,
          age: null,
          annualIncome: null,
          creditScore: 720,
          amountDown: null,
          mortgageType: null,
          monthlyDebt: null,
          homesteadExemption: false,
        });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching financial profile:", error);
      res.status(500).json({ message: "Failed to fetch financial profile" });
    }
  });

  app.put("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Parse numeric fields from strings
      const profileData = {
        ...req.body,
        age: req.body.age ? parseInt(req.body.age) : undefined,
        annualIncome: req.body.annualIncome ? req.body.annualIncome : null,
        creditScore: req.body.creditScore ? parseInt(req.body.creditScore) : 720,
        amountDown: req.body.amountDown ? req.body.amountDown : null,
        monthlyDebt: req.body.monthlyDebt ? req.body.monthlyDebt : null,
      };
      
      const profile = await storage.upsertFinancialProfile({
        userId,
        age: profileData.age,
        annualIncome: profileData.annualIncome,
        creditScore: profileData.creditScore,
        amountDown: profileData.amountDown,
        mortgageType: profileData.mortgageType || null,
        monthlyDebt: profileData.monthlyDebt,
        homesteadExemption: profileData.homesteadExemption ?? false,
      });
      
      res.json(profile);
    } catch (error: any) {
      console.error("Error saving financial profile:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save financial profile" });
    }
  });

  // Mortgage Calculation routes
  app.post("/api/calculate-mortgage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const validatedData = mortgageCalculationFormSchema.parse(req.body);
      
      // Get user's financial profile
      const profile = await storage.getFinancialProfile(userId);
      
      // Calculate mortgage using AI
      const calculation = await calculateMortgageWithAI({
        address: validatedData.address,
        askingPrice: parseFloat(validatedData.askingPrice),
        financialProfile: {
          age: profile?.age ?? undefined,
          annualIncome: profile?.annualIncome ? parseFloat(profile.annualIncome) : undefined,
          creditScore: profile?.creditScore ?? undefined,
          amountDown: profile?.amountDown ? parseFloat(profile.amountDown) : undefined,
          mortgageType: profile?.mortgageType ?? undefined,
          monthlyDebt: profile?.monthlyDebt ? parseFloat(profile.monthlyDebt) : undefined,
          homesteadExemption: profile?.homesteadExemption ?? false,
        },
      });
      
      // Save calculation to database
      const savedCalculation: InsertSavedCalculation = {
        userId,
        address: validatedData.address,
        askingPrice: validatedData.askingPrice,
        propertyPhotoUrl: validatedData.propertyPhotoUrl || null,
        principal: calculation.principal.toString(),
        interest: calculation.interest.toString(),
        propertyTaxes: calculation.propertyTaxes.toString(),
        hoa: calculation.hoa.toString(),
        pmi: calculation.pmi.toString(),
        homeownersInsurance: calculation.homeownersInsurance.toString(),
        floodInsurance: calculation.floodInsurance.toString(),
        other: calculation.other.toString(),
        totalMonthlyPayment: calculation.totalMonthlyPayment.toString(),
        snapshotAge: profile?.age ?? null,
        snapshotAnnualIncome: profile?.annualIncome ?? null,
        snapshotCreditScore: profile?.creditScore ?? null,
        snapshotAmountDown: profile?.amountDown ?? null,
        snapshotMortgageType: profile?.mortgageType ?? null,
        snapshotMonthlyDebt: profile?.monthlyDebt ?? null,
        snapshotHomesteadExemption: profile?.homesteadExemption ?? null,
      };
      
      const result = await storage.createCalculation(savedCalculation);
      
      res.json(result);
    } catch (error: any) {
      console.error("Error calculating mortgage:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid calculation data", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to calculate mortgage" });
    }
  });

  // Saved Calculations routes
  app.get("/api/calculations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const calculations = await storage.getCalculationsByUserId(userId);
      res.json(calculations);
    } catch (error) {
      console.error("Error fetching calculations:", error);
      res.status(500).json({ message: "Failed to fetch calculations" });
    }
  });

  app.get("/api/calculations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const calculation = await storage.getCalculation(req.params.id);
      
      if (!calculation) {
        return res.status(404).json({ message: "Calculation not found" });
      }
      
      // Verify ownership
      if (calculation.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(calculation);
    } catch (error) {
      console.error("Error fetching calculation:", error);
      res.status(500).json({ message: "Failed to fetch calculation" });
    }
  });

  app.post("/api/calculations/:id/save", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const calculation = await storage.getCalculation(req.params.id);
      
      if (!calculation) {
        return res.status(404).json({ message: "Calculation not found" });
      }
      
      // Verify ownership
      if (calculation.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Calculation is already saved in the database
      res.json({ message: "Calculation saved successfully" });
    } catch (error) {
      console.error("Error saving calculation:", error);
      res.status(500).json({ message: "Failed to save calculation" });
    }
  });

  app.delete("/api/calculations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const calculation = await storage.getCalculation(req.params.id);
      
      if (!calculation) {
        return res.status(404).json({ message: "Calculation not found" });
      }
      
      // Verify ownership
      if (calculation.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteCalculation(req.params.id);
      res.json({ message: "Calculation deleted successfully" });
    } catch (error) {
      console.error("Error deleting calculation:", error);
      res.status(500).json({ message: "Failed to delete calculation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
