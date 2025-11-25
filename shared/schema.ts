import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Financial Profile table - stores user's financial information
export const financialProfiles = pgTable("financial_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  age: integer("age"),
  annualIncome: decimal("annual_income", { precision: 12, scale: 2 }),
  creditScore: integer("credit_score"),
  amountDown: decimal("amount_down", { precision: 12, scale: 2 }),
  mortgageType: varchar("mortgage_type", { length: 50 }),
  monthlyDebt: decimal("monthly_debt", { precision: 12, scale: 2 }),
  homesteadExemption: boolean("homestead_exemption").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const financialProfilesRelations = relations(financialProfiles, ({ one }) => ({
  user: one(users, {
    fields: [financialProfiles.userId],
    references: [users.id],
  }),
}));

export const insertFinancialProfileSchema = createInsertSchema(financialProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFinancialProfile = z.infer<typeof insertFinancialProfileSchema>;
export type FinancialProfile = typeof financialProfiles.$inferSelect;

// Saved Calculations table - stores mortgage calculation results
export const savedCalculations = pgTable("saved_calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  askingPrice: decimal("asking_price", { precision: 12, scale: 2 }).notNull(),
  propertyPhotoUrl: text("property_photo_url"),
  
  // Mortgage calculation results
  principal: decimal("principal", { precision: 12, scale: 2 }).notNull(),
  interest: decimal("interest", { precision: 12, scale: 2 }).notNull(),
  propertyTaxes: decimal("property_taxes", { precision: 12, scale: 2 }).notNull(),
  hoa: decimal("hoa", { precision: 12, scale: 2 }).notNull(),
  pmi: decimal("pmi", { precision: 12, scale: 2 }).notNull(),
  homeownersInsurance: decimal("homeowners_insurance", { precision: 12, scale: 2 }).notNull(),
  floodInsurance: decimal("flood_insurance", { precision: 12, scale: 2 }).notNull(),
  other: decimal("other", { precision: 12, scale: 2 }).notNull(),
  totalMonthlyPayment: decimal("total_monthly_payment", { precision: 12, scale: 2 }).notNull(),
  
  // Financial profile snapshot at time of calculation
  snapshotAge: integer("snapshot_age"),
  snapshotAnnualIncome: decimal("snapshot_annual_income", { precision: 12, scale: 2 }),
  snapshotCreditScore: integer("snapshot_credit_score"),
  snapshotAmountDown: decimal("snapshot_amount_down", { precision: 12, scale: 2 }),
  snapshotMortgageType: varchar("snapshot_mortgage_type", { length: 50 }),
  snapshotMonthlyDebt: decimal("snapshot_monthly_debt", { precision: 12, scale: 2 }),
  snapshotHomesteadExemption: boolean("snapshot_homestead_exemption"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const savedCalculationsRelations = relations(savedCalculations, ({ one }) => ({
  user: one(users, {
    fields: [savedCalculations.userId],
    references: [users.id],
  }),
}));

export const insertSavedCalculationSchema = createInsertSchema(savedCalculations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSavedCalculation = z.infer<typeof insertSavedCalculationSchema>;
export type SavedCalculation = typeof savedCalculations.$inferSelect;

// Validation schemas for forms
export const financialProfileFormSchema = insertFinancialProfileSchema.extend({
  age: z.number().min(18).max(100).optional(),
  annualIncome: z.string().optional(),
  creditScore: z.number().min(300).max(850).optional(),
  amountDown: z.string().optional(),
  mortgageType: z.string().optional(),
  monthlyDebt: z.string().optional(),
  homesteadExemption: z.boolean().optional(),
});

export const mortgageCalculationFormSchema = z.object({
  address: z.string().min(1, "Address is required"),
  askingPrice: z.string().min(1, "Asking price is required"),
  propertyPhotoUrl: z.string().optional(),
});

export type FinancialProfileFormData = z.infer<typeof financialProfileFormSchema>;
export type MortgageCalculationFormData = z.infer<typeof mortgageCalculationFormSchema>;
