import {
  users,
  financialProfiles,
  savedCalculations,
  type User,
  type UpsertUser,
  type FinancialProfile,
  type InsertFinancialProfile,
  type SavedCalculation,
  type InsertSavedCalculation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Financial Profile operations
  getFinancialProfile(userId: string): Promise<FinancialProfile | undefined>;
  upsertFinancialProfile(profile: InsertFinancialProfile): Promise<FinancialProfile>;
  
  // Saved Calculations operations
  getCalculation(id: string): Promise<SavedCalculation | undefined>;
  getCalculationsByUserId(userId: string): Promise<SavedCalculation[]>;
  createCalculation(calculation: InsertSavedCalculation): Promise<SavedCalculation>;
  updateCalculation(id: string, updates: Partial<InsertSavedCalculation>): Promise<SavedCalculation>;
  deleteCalculation(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Financial Profile operations
  async getFinancialProfile(userId: string): Promise<FinancialProfile | undefined> {
    const [profile] = await db
      .select()
      .from(financialProfiles)
      .where(eq(financialProfiles.userId, userId));
    return profile;
  }

  async upsertFinancialProfile(profileData: InsertFinancialProfile): Promise<FinancialProfile> {
    // Check if profile exists
    const existing = await this.getFinancialProfile(profileData.userId);
    
    if (existing) {
      // Update existing profile
      const [profile] = await db
        .update(financialProfiles)
        .set({
          ...profileData,
          updatedAt: new Date(),
        })
        .where(eq(financialProfiles.userId, profileData.userId))
        .returning();
      return profile;
    } else {
      // Create new profile
      const [profile] = await db
        .insert(financialProfiles)
        .values(profileData)
        .returning();
      return profile;
    }
  }

  // Saved Calculations operations
  async getCalculation(id: string): Promise<SavedCalculation | undefined> {
    const [calculation] = await db
      .select()
      .from(savedCalculations)
      .where(eq(savedCalculations.id, id));
    return calculation;
  }

  async getCalculationsByUserId(userId: string): Promise<SavedCalculation[]> {
    const calculations = await db
      .select()
      .from(savedCalculations)
      .where(eq(savedCalculations.userId, userId))
      .orderBy(desc(savedCalculations.createdAt));
    return calculations;
  }

  async createCalculation(calculationData: InsertSavedCalculation): Promise<SavedCalculation> {
    const [calculation] = await db
      .insert(savedCalculations)
      .values(calculationData)
      .returning();
    return calculation;
  }

  async updateCalculation(id: string, updates: Partial<InsertSavedCalculation>): Promise<SavedCalculation> {
    const [calculation] = await db
      .update(savedCalculations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(savedCalculations.id, id))
      .returning();
    return calculation;
  }

  async deleteCalculation(id: string): Promise<void> {
    await db.delete(savedCalculations).where(eq(savedCalculations.id, id));
  }
}

export const storage = new DatabaseStorage();
