import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// Reference: javascript_openai_ai_integrations blueprint
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
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

export async function calculateMortgageWithAI(
  input: MortgageCalculationInput
): Promise<MortgageCalculationResult> {
  const prompt = `You are a mortgage calculation expert. Analyze the following property and financial information to provide a detailed monthly mortgage payment breakdown.

Property Information:
- Address: ${input.address}
- Asking Price: $${input.askingPrice.toLocaleString()}

Financial Profile:
- Age: ${input.financialProfile.age || "Not provided"}
- Annual Income: $${input.financialProfile.annualIncome?.toLocaleString() || "Not provided"}
- Credit Score: ${input.financialProfile.creditScore || "Not provided"}
- Down Payment: $${input.financialProfile.amountDown?.toLocaleString() || "Not provided"}
- Mortgage Type: ${input.financialProfile.mortgageType || "30-year-fixed"}
- Monthly Debt: $${input.financialProfile.monthlyDebt?.toLocaleString() || "0"}
- Homestead Exemption: ${input.financialProfile.homesteadExemption ? "Yes" : "No"}

Please calculate and provide the following monthly payment components in JSON format:

1. Principal: Monthly principal payment
2. Interest: Monthly interest payment (use current market rates for the specified mortgage type)
3. Property Taxes: Monthly property tax estimate (research typical rates for this property's location)
4. HOA: Monthly HOA fees (estimate based on property type and location, or 0 if unlikely)
5. PMI: Private Mortgage Insurance (if down payment is less than 20%, calculate PMI)
6. Homeowners Insurance: Monthly homeowners insurance estimate for this property type and location
7. Flood Insurance: Monthly flood insurance (estimate based on location's flood risk, or 0 if not in flood zone)
8. Other: Any other estimated monthly costs (utilities escrow, etc.)

IMPORTANT:
- Research the property's location to determine accurate property tax rates and insurance costs
- If homestead exemption is enabled, apply appropriate property tax reductions based on the location's laws
- Use realistic market interest rates for the mortgage type
- Calculate PMI only if down payment is less than 20% of the asking price
- All values should be realistic monthly amounts in USD
- Return ONLY a valid JSON object with these exact keys: principal, interest, propertyTaxes, hoa, pmi, homeownersInsurance, floodInsurance, other

Example output format:
{
  "principal": 1432,
  "interest": 1250,
  "propertyTaxes": 583,
  "hoa": 150,
  "pmi": 125,
  "homeownersInsurance": 167,
  "floodInsurance": 75,
  "other": 65
}`;

  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a precise mortgage calculator that returns only valid JSON responses with accurate financial calculations based on real-world data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(content) as MortgageCalculationResult;
    
    // Calculate total
    const total = 
      result.principal +
      result.interest +
      result.propertyTaxes +
      result.hoa +
      result.pmi +
      result.homeownersInsurance +
      result.floodInsurance +
      result.other;

    return {
      ...result,
      totalMonthlyPayment: Math.round(total * 100) / 100,
    };
  } catch (error) {
    console.error("Error calculating mortgage with AI:", error);
    throw new Error("Failed to calculate mortgage. Please try again.");
  }
}
