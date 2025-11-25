import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// Reference: javascript_openai_ai_integrations blueprint
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
});

interface MortgageCalculationInput {
  address: string;
  askingPrice: number;
  financialProfile: {
    age?: number;
    annualIncome?: number;
    creditScore?: number;
    amountDown?: number;
    mortgageType?: string;
    monthlyDebt?: number;
    homesteadExemption?: boolean;
  };
}

interface MortgageCalculationResult {
  principal: number;
  interest: number;
  propertyTaxes: number;
  hoa: number;
  pmi: number;
  homeownersInsurance: number;
  floodInsurance: number;
  other: number;
  totalMonthlyPayment: number;
}

// Use simplified calculations instead of AI to avoid delays
export async function calculateMortgageWithAI(
  input: MortgageCalculationInput
): Promise<MortgageCalculationResult> {
  try {
    // Standard mortgage calculations
    const loanAmount = input.askingPrice - (input.financialProfile.amountDown || 0);
    const downPaymentPercent = input.financialProfile.amountDown ? 
      (input.financialProfile.amountDown / input.askingPrice) * 100 : 0;

    // Get current mortgage rate based on credit score (simplified)
    const creditScore = input.financialProfile.creditScore || 720;
    let interestRate = 6.5; // Base rate
    if (creditScore >= 780) interestRate = 6.0;
    else if (creditScore >= 740) interestRate = 6.25;
    else if (creditScore >= 700) interestRate = 6.5;
    else if (creditScore >= 660) interestRate = 7.0;
    else interestRate = 7.5;

    // Mortgage term (years)
    const mortgageYears = input.financialProfile.mortgageType?.includes("15") ? 15 : 30;
    const mortgageMonths = mortgageYears * 12;

    // Calculate principal and interest using amortization formula
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, mortgageMonths)) / 
      (Math.pow(1 + monthlyRate, mortgageMonths) - 1);

    // First month interest calculation (decreases over time, this is approximate first month)
    const firstMonthInterest = loanAmount * monthlyRate;
    const principal = monthlyPayment - firstMonthInterest;

    // Property taxes (average ~1.2% of home value per year)
    let propertyTaxRate = 0.012;
    if (input.financialProfile.homesteadExemption) {
      propertyTaxRate = 0.008; // Reduced with homestead exemption
    }
    const propertyTaxes = Math.round((input.askingPrice * propertyTaxRate) / 12 * 100) / 100;

    // HOA fees (if property type suggests it)
    const hoa = input.address.toLowerCase().includes("condo") || 
                input.address.toLowerCase().includes("townhouse") ? 150 : 0;

    // PMI calculation (if down payment < 20%)
    let pmi = 0;
    if (downPaymentPercent < 20 && downPaymentPercent > 0) {
      // Standard PMI is 0.3% - 1.5% of loan amount annually
      const pmiRate = 0.008; // 0.8% annual rate
      pmi = Math.round((loanAmount * pmiRate) / 12 * 100) / 100;
    }

    // Homeowners insurance (average ~$100-200/month, varies by location)
    const homeownersInsurance = 150;

    // Flood insurance (most properties don't need it, estimate low)
    const floodInsurance = 0;

    // Other costs
    const other = 50;

    const total = principal + firstMonthInterest + propertyTaxes + hoa + pmi + homeownersInsurance + floodInsurance + other;

    return {
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(firstMonthInterest * 100) / 100,
      propertyTaxes,
      hoa,
      pmi,
      homeownersInsurance,
      floodInsurance,
      other,
      totalMonthlyPayment: Math.round(total * 100) / 100,
    };
  } catch (error) {
    console.error("Error calculating mortgage:", error);
    throw new Error("Failed to calculate mortgage. Please try again.");
  }
}
