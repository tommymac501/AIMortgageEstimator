import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// Reference: javascript_openai_ai_integrations blueprint
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  timeout: 15000, // 15 second timeout
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

// Extract zip code from address
function extractZipCode(address: string): string | null {
  const zipMatch = address.match(/\b\d{5}(?:-\d{4})?\b/);
  return zipMatch ? zipMatch[0] : null;
}

// Standard math calculations for principal, interest, and PMI
function calculatePrincipalAndInterest(
  askingPrice: number,
  amountDown: number | undefined,
  creditScore: number | undefined,
  mortgageType: string | undefined
): { principal: number; interest: number; pmi: number; monthlyPayment: number } {
  const loanAmount = askingPrice - (amountDown || 0);
  const downPaymentPercent = amountDown ? (amountDown / askingPrice) * 100 : 0;

  // Interest rate based on credit score
  const score = creditScore || 720;
  let interestRate = 6.5;
  if (score >= 780) interestRate = 6.0;
  else if (score >= 740) interestRate = 6.25;
  else if (score >= 700) interestRate = 6.5;
  else if (score >= 660) interestRate = 7.0;
  else interestRate = 7.5;

  // Mortgage term
  const mortgageYears = mortgageType?.includes("15") ? 15 : 30;
  const mortgageMonths = mortgageYears * 12;

  // Amortization formula
  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment =
    loanAmount *
    ((monthlyRate * Math.pow(1 + monthlyRate, mortgageMonths)) /
      (Math.pow(1 + monthlyRate, mortgageMonths) - 1));

  // First month interest
  const firstMonthInterest = loanAmount * monthlyRate;
  const principal = monthlyPayment - firstMonthInterest;

  // PMI calculation (if down payment < 20%)
  let pmi = 0;
  if (downPaymentPercent < 20 && downPaymentPercent > 0) {
    const pmiRate = 0.008; // 0.8% annual rate
    pmi = Math.round((loanAmount * pmiRate) / 12 * 100) / 100;
  }

  return {
    principal: Math.round(principal * 100) / 100,
    interest: Math.round(firstMonthInterest * 100) / 100,
    pmi,
    monthlyPayment,
  };
}

export async function calculateMortgageWithAI(
  input: MortgageCalculationInput
): Promise<MortgageCalculationResult> {
  try {
    // Use standard math for principal, interest, and PMI
    const mathResults = calculatePrincipalAndInterest(
      input.askingPrice,
      input.financialProfile.amountDown,
      input.financialProfile.creditScore,
      input.financialProfile.mortgageType
    );

    // Extract zip code for tax lookup
    const zipCode = extractZipCode(input.address);

    // Use AI for property taxes (with homestead exemption), HOA, and insurance estimates
    const prompt = `You are a real estate and mortgage expert. Based on the following information, provide accurate estimates for property taxes, HOA fees, and insurance costs.

Property Information:
- Address: ${input.address}
- Zip Code: ${zipCode || "Unknown"}
- Asking Price: $${input.askingPrice.toLocaleString()}
- Homestead Exemption: ${input.financialProfile.homesteadExemption ? "YES - Apply any available homestead exemption discounts for this location" : "NO"}

Please research and provide monthly cost estimates in JSON format with these exact keys:
- propertyTaxes: Monthly property tax estimate (account for homestead exemption if applicable for this zip code)
- hoa: Monthly HOA fees (0 if not a condo/townhouse/planned community)
- homeownersInsurance: Monthly homeowners insurance estimate
- floodInsurance: Monthly flood insurance estimate (0 if low/no risk)

Return ONLY valid JSON. Example:
{
  "propertyTaxes": 250,
  "hoa": 0,
  "homeownersInsurance": 125,
  "floodInsurance": 50
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a financial expert. Return only valid JSON with numeric values for monthly costs.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const aiResults = JSON.parse(content);

    // Ensure all values are numbers
    const propertyTaxes = Math.round(parseFloat(aiResults.propertyTaxes) * 100) / 100 || 250;
    const hoa = Math.round(parseFloat(aiResults.hoa) * 100) / 100 || 0;
    const homeownersInsurance =
      Math.round(parseFloat(aiResults.homeownersInsurance) * 100) / 100 || 125;
    const floodInsurance = Math.round(parseFloat(aiResults.floodInsurance) * 100) / 100 || 0;
    const other = 50; // Miscellaneous costs

    const total =
      mathResults.principal +
      mathResults.interest +
      propertyTaxes +
      hoa +
      mathResults.pmi +
      homeownersInsurance +
      floodInsurance +
      other;

    return {
      principal: mathResults.principal,
      interest: mathResults.interest,
      propertyTaxes,
      hoa,
      pmi: mathResults.pmi,
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
