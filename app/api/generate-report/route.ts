import { type NextRequest, NextResponse } from "next/server"
import type { CompanyData, FinancialReport } from "@/types/company"
import type { ProcessedFinancialData } from "@/types/accounting"

export async function POST(request: NextRequest) {
  try {
    const { companyData }: { companyData: CompanyData } = await request.json()
    console.log("Generating report for company:", companyData.navn)

    // Step 1: Try to fetch financial data (will likely fail for now)
    let financialData: ProcessedFinancialData[] = []
    let hasAccountingData = false
    let dataSourceMessage = "Using industry estimates and company registration data"

    try {
      console.log("Checking for accounting data availability...")
      const accountingResponse = await fetch(
        `${request.nextUrl.origin}/api/accounting?orgnr=${companyData.organisasjonsnummer}`,
      )

      if (accountingResponse.ok) {
        financialData = await accountingResponse.json()
        hasAccountingData = financialData.length > 0
        dataSourceMessage = "Using official financial statements"
        console.log(`Successfully fetched ${financialData.length} years of financial data`)
      } else {
        const errorData = await accountingResponse.json()
        dataSourceMessage = errorData.suggestion || "Using industry estimates and company registration data"
        console.log("Accounting data not available:", errorData.message)
      }
    } catch (accountingError) {
      console.log("Could not access accounting data:", accountingError)
      dataSourceMessage = "Using industry estimates and company registration data"
    }

    // Step 2: Create comprehensive report using available data
    const baseReport = createComprehensiveReport(companyData, financialData, dataSourceMessage)
    console.log(`Base report created successfully using ${hasAccountingData ? "real" : "estimated"} financial data`)

    // Step 3: Enhance with AI insights
    try {
      const enhancedReport = await enhanceWithAIInsights(baseReport, companyData, financialData, dataSourceMessage)
      console.log("Successfully enhanced report with AI insights")
      return NextResponse.json(enhancedReport)
    } catch (aiError) {
      console.log("AI enhancement failed, returning base report:", aiError)
      return NextResponse.json(baseReport)
    }
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function enhanceWithAIInsights(
  baseReport: FinancialReport,
  companyData: CompanyData,
  financialData: ProcessedFinancialData[],
  dataSourceMessage: string,
): Promise<FinancialReport> {
  const location = companyData.forretningsadresse
    ? `${companyData.forretningsadresse.poststed || ""}, ${companyData.forretningsadresse.kommune || ""}`.replace(
        /^,\s*|,\s*$/g,
        "",
      )
    : "Norway"

  const industryInfo = companyData.naeringskode1?.beskrivelse || "General Business"
  const legalForm = companyData.organisasjonsform?.beskrivelse || "Limited Company"
  const employees = companyData.antallAnsatte || baseReport.keyMetrics.employees

  // Create comprehensive prompt for AI analysis
  const prompt = `Analyze this Norwegian company and provide specific business insights:

COMPANY INFORMATION:
- Name: ${companyData.navn}
- Organization Number: ${companyData.organisasjonsnummer}
- Industry: ${industryInfo}
- Legal Form: ${legalForm}
- Location: ${location}
- Employees: ${employees}
- VAT Registered: ${companyData.registrertIMvaregisteret ? "Yes" : "No"}
- Founded: ${baseReport.keyMetrics.foundedYear}
- Status: ${companyData.konkurs ? "Bankrupt" : companyData.underAvvikling ? "Under liquidation" : "Active"}

FINANCIAL ANALYSIS:
${
  financialData.length > 0
    ? `Real Financial Data Available:
${financialData
  .slice(0, 3)
  .map(
    (data) =>
      `- Year ${data.year}: Revenue: ${data.revenue ? `${(data.revenue / 1000000).toFixed(1)}M NOK` : "N/A"}, Profit: ${data.profit ? `${(data.profit / 1000000).toFixed(1)}M NOK` : "N/A"}`,
  )
  .join("\n")}`
    : `Data Source: ${dataSourceMessage}
Estimated Revenue: ${(baseReport.keyMetrics.revenue / 1000000).toFixed(1)}M NOK
Analysis based on industry benchmarks and company size`
}

MARKET CONTEXT:
- Norwegian ${industryInfo.toLowerCase()} sector
- ${employees} employees indicating ${employees > 100 ? "large" : employees > 20 ? "medium" : "small"} company size
- Located in ${location}

Based on this comprehensive analysis, provide insights in this exact format:

MARKET_POSITION: [One sentence about the company's position in the Norwegian market]

FUTURE_OUTLOOK: [One sentence about future prospects considering Norwegian market conditions]

COMPETITIVE_ADVANTAGE: [One sentence about main competitive advantages]

INVESTMENT_REASONING: [One sentence about investment potential and rationale]

STRENGTHS:
- [Strength 1 - focus on Norwegian market advantages]
- [Strength 2 - operational or industry-specific strength]
- [Strength 3 - financial or strategic strength]

WEAKNESSES:
- [Weakness 1 - market or competitive challenge]
- [Weakness 2 - operational or financial limitation]
- [Weakness 3 - strategic or growth constraint]

OPPORTUNITIES:
- [Opportunity 1 - Norwegian market opportunity]
- [Opportunity 2 - industry or technology opportunity]
- [Opportunity 3 - expansion or strategic opportunity]

THREATS:
- [Threat 1 - market or competitive threat]
- [Threat 2 - economic or regulatory threat]
- [Threat 3 - industry or operational threat]`

  console.log("Sending comprehensive analysis request to Hugging Face AI...")

  const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1", {
    method: "POST",
    headers: {
      Authorization: "Bearer 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",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 1200,
        temperature: 0.7,
        return_full_text: false,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Hugging Face API request failed: ${response.status}`)
  }

  const aiResponse = await response.json()
  let generatedText = ""

  if (Array.isArray(aiResponse) && aiResponse[0]?.generated_text) {
    generatedText = aiResponse[0].generated_text
  } else if (typeof aiResponse === "string") {
    generatedText = aiResponse
  } else {
    throw new Error("Unexpected AI response format")
  }

  // Parse and enhance the report
  const enhancedReport = { ...baseReport }

  try {
    // Extract insights using regex patterns
    const marketPositionMatch = generatedText.match(/MARKET_POSITION:\s*(.+?)(?=\n|$)/i)
    if (marketPositionMatch) {
      enhancedReport.trendAnalysis.marketPosition = marketPositionMatch[1].trim()
    }

    const futureOutlookMatch = generatedText.match(/FUTURE_OUTLOOK:\s*(.+?)(?=\n|$)/i)
    if (futureOutlookMatch) {
      enhancedReport.trendAnalysis.futureOutlook = futureOutlookMatch[1].trim()
    }

    const competitiveAdvantageMatch = generatedText.match(/COMPETITIVE_ADVANTAGE:\s*(.+?)(?=\n|$)/i)
    if (competitiveAdvantageMatch) {
      enhancedReport.competitorAnalysis.competitiveAdvantage = competitiveAdvantageMatch[1].trim()
    }

    const investmentReasoningMatch = generatedText.match(/INVESTMENT_REASONING:\s*(.+?)(?=\n|$)/i)
    if (investmentReasoningMatch) {
      enhancedReport.investmentRecommendation.reasoning = investmentReasoningMatch[1].trim()
    }

    // Extract SWOT items
    const strengthsMatch = generatedText.match(/STRENGTHS:\s*((?:\s*-\s*.+\n?)+)/i)
    if (strengthsMatch) {
      const strengths = strengthsMatch[1]
        .split("\n")
        .map((s) => s.replace(/^\s*-\s*/, "").trim())
        .filter((s) => s.length > 0)
        .slice(0, 3)
      if (strengths.length > 0) {
        enhancedReport.swotAnalysis.strengths = strengths
      }
    }

    const weaknessesMatch = generatedText.match(/WEAKNESSES:\s*((?:\s*-\s*.+\n?)+)/i)
    if (weaknessesMatch) {
      const weaknesses = weaknessesMatch[1]
        .split("\n")
        .map((s) => s.replace(/^\s*-\s*/, "").trim())
        .filter((s) => s.length > 0)
        .slice(0, 3)
      if (weaknesses.length > 0) {
        enhancedReport.swotAnalysis.weaknesses = weaknesses
      }
    }

    const opportunitiesMatch = generatedText.match(/OPPORTUNITIES:\s*((?:\s*-\s*.+\n?)+)/i)
    if (opportunitiesMatch) {
      const opportunities = opportunitiesMatch[1]
        .split("\n")
        .map((s) => s.replace(/^\s*-\s*/, "").trim())
        .filter((s) => s.length > 0)
        .slice(0, 3)
      if (opportunities.length > 0) {
        enhancedReport.swotAnalysis.opportunities = opportunities
      }
    }

    const threatsMatch = generatedText.match(/THREATS:\s*((?:\s*-\s*.+\n?)+)/i)
    if (threatsMatch) {
      const threats = threatsMatch[1]
        .split("\n")
        .map((s) => s.replace(/^\s*-\s*/, "").trim())
        .filter((s) => s.length > 0)
        .slice(0, 3)
      if (threats.length > 0) {
        enhancedReport.swotAnalysis.threats = threats
      }
    }

    console.log("Successfully parsed AI insights")
  } catch (parseError) {
    console.log("Could not parse some AI insights, using base report data")
  }

  return enhancedReport
}

function createComprehensiveReport(
  companyData: CompanyData,
  financialData: ProcessedFinancialData[],
  dataSourceMessage: string,
): FinancialReport {
  const currentYear = new Date().getFullYear()
  const foundedYear = companyData.stiftelsesdato
    ? new Date(companyData.stiftelsesdato).getFullYear()
    : companyData.registreringsdatoEnhetsregisteret
      ? new Date(companyData.registreringsdatoEnhetsregisteret).getFullYear()
      : currentYear - 10

  const location = companyData.forretningsadresse
    ? `${companyData.forretningsadresse.poststed || ""}, ${companyData.forretningsadresse.kommune || ""}`.replace(
        /^,\s*|,\s*$/g,
        "",
      )
    : "Norway"

  const industryCode = companyData.naeringskode1?.kode || ""
  const industryName = companyData.naeringskode1?.beskrivelse || "General Business"
  const legalForm = companyData.organisasjonsform?.beskrivelse || "Limited Company"

  // Use real financial data if available, otherwise create sophisticated estimates
  let revenue: number
  let employees: number
  let hasRealFinancialData = false
  let financialDataYear: number | undefined
  let currency = "NOK"
  let additionalMetrics = {}

  if (financialData.length > 0 && financialData[0].revenue) {
    const latestFinancials = financialData[0]
    revenue = latestFinancials.revenue
    employees = latestFinancials.employees || companyData.antallAnsatte || 10
    hasRealFinancialData = true
    financialDataYear = latestFinancials.year
    currency = latestFinancials.currency

    // Add additional metrics from structured data
    additionalMetrics = {
      operatingProfit: latestFinancials.operatingProfit,
      debt: latestFinancials.debt,
      currentAssets: latestFinancials.currentAssets,
      fixedAssets: latestFinancials.fixedAssets,
      financialIncome: latestFinancials.financialIncome,
      financialCosts: latestFinancials.financialCosts,
      companySize: latestFinancials.companySize,
      isParentCompany: latestFinancials.isParentCompany,
    }

    console.log(`Using real structured financial data from ${financialDataYear}`)
    console.log(
      `Additional metrics: Operating Profit=${latestFinancials.operatingProfit ? (latestFinancials.operatingProfit / 1000000).toFixed(1) + "M" : "N/A"}, Debt=${latestFinancials.debt ? (latestFinancials.debt / 1000000).toFixed(1) + "M" : "N/A"}`,
    )
  } else {
    employees = companyData.antallAnsatte || 10
    revenue = estimateRevenue(employees, industryCode, companyData.registrertIMvaregisteret || false)
    hasRealFinancialData = false
    console.log(`Using sophisticated estimates based on industry analysis`)
  }

  const industryGrowthRate = getIndustryGrowthRate(industryCode)
  const marketShareEstimate = calculateMarketShare(employees, industryCode)

  // Create comprehensive chart data
  const revenueChartData = createRevenueChartData(financialData, revenue, industryGrowthRate, currentYear)
  const employeeChartData = createEmployeeChartData(financialData, employees, currentYear)
  const profitChartData = createProfitChartData(financialData, revenue, currentYear)

  return {
    companyName: companyData.navn,
    organizationNumber: companyData.organisasjonsnummer,
    keyMetrics: {
      revenue,
      profit: financialData.length > 0 ? financialData[0].profit || undefined : undefined,
      totalAssets: financialData.length > 0 ? financialData[0].totalAssets || undefined : undefined,
      equity: financialData.length > 0 ? financialData[0].equity || undefined : undefined,
      debt: financialData.length > 0 ? financialData[0].debt || undefined : undefined,
      operatingProfit: financialData.length > 0 ? financialData[0].operatingProfit || undefined : undefined,
      employees,
      foundedYear,
      industry: industryName,
      legalForm,
      registrationDate: companyData.registreringsdatoEnhetsregisteret || "Unknown",
      vatRegistered: companyData.registrertIMvaregisteret || false,
      location,
      hasRealFinancialData,
      financialDataYear,
      currency,
      companySize: financialData.length > 0 ? financialData[0].companySize : undefined,
      isParentCompany: financialData.length > 0 ? financialData[0].isParentCompany : undefined,
    },
    trendAnalysis: {
      growthRate: calculateActualGrowthRate(financialData) || industryGrowthRate,
      marketPosition: `${legalForm.toLowerCase()} operating in the ${industryName.toLowerCase()} sector with ${employees} employees in ${location}${hasRealFinancialData ? ` (${financialDataYear} financials)` : ` (${dataSourceMessage.toLowerCase()})`}`,
      futureOutlook: `${hasRealFinancialData ? "Based on recent financial performance" : "Based on industry analysis and company profile"}, projected ${industryGrowthRate}% annual growth in the Norwegian ${industryName.toLowerCase()} market`,
    },
    competitorAnalysis: {
      marketShare: marketShareEstimate,
      competitiveAdvantage: `Established Norwegian ${legalForm.toLowerCase()} with ${hasRealFinancialData ? "documented financial performance" : "strong market positioning"} in ${industryName.toLowerCase()}`,
      threats: [
        "Increased competition from international players",
        "Economic uncertainty affecting Norwegian market",
        "Digital transformation and technology disruption",
      ],
    },
    swotAnalysis: {
      strengths: [
        `Established ${legalForm.toLowerCase()} with ${employees} employees${hasRealFinancialData ? " and proven financial track record" : ""}`,
        `Specialized expertise in ${industryName.toLowerCase()}`,
        companyData.registrertIMvaregisteret
          ? "VAT registered with full commercial operations"
          : "Streamlined business structure",
      ],
      weaknesses: [
        "Limited international market presence",
        "Dependency on Norwegian economic conditions",
        "Need for continuous innovation and market adaptation",
      ],
      opportunities: [
        "Digital transformation and automation opportunities",
        "Expansion to other Nordic markets",
        "Strategic partnerships and market consolidation",
      ],
      threats: [
        "Economic downturn affecting domestic demand",
        "Increased regulatory compliance requirements",
        "Rising competition from larger international firms",
      ],
    },
    investmentRecommendation: {
      rating: getInvestmentRating(
        employees,
        industryGrowthRate,
        companyData.registrertIMvaregisteret || false,
        hasRealFinancialData,
      ),
      targetPrice: Math.round(revenue * getValuationMultiple(industryCode)),
      reasoning: `${legalForm} with ${employees} employees showing ${hasRealFinancialData ? "documented" : "estimated"} performance in the Norwegian ${industryName.toLowerCase()} sector`,
      riskLevel: getRiskLevel(employees, industryGrowthRate, hasRealFinancialData),
    },
    chartData: {
      revenue: revenueChartData,
      employees: employeeChartData,
      profit: profitChartData,
      marketShare: [
        { category: "Company", value: marketShareEstimate },
        { category: "Competitors", value: Math.round((100 - marketShareEstimate) * 10) / 10 },
      ],
    },
  }
}

// Enhanced estimation functions
function estimateRevenue(employees: number, industryCode: string, vatRegistered: boolean): number {
  const baseRevenue = employees * 850000 // 850k NOK per employee base (updated)
  const industryMultiplier = getIndustryMultiplier(industryCode)
  const vatMultiplier = vatRegistered ? 1.2 : 1.0 // VAT registered companies tend to be larger
  return Math.round(baseRevenue * industryMultiplier * vatMultiplier)
}

function calculateMarketShare(employees: number, industryCode: string): number {
  // More sophisticated market share calculation
  const baseShare = Math.min(15, Math.max(0.1, (employees / 500) * 5))
  const industryFactor = getIndustryConcentration(industryCode)
  return Math.round(baseShare * industryFactor * 10) / 10
}

function getIndustryConcentration(industryCode: string): number {
  // Industry concentration factors (higher = more fragmented market, easier to gain share)
  const concentrations: { [key: string]: number } = {
    "62": 0.8, // IT - fragmented
    "63": 0.9, // Information services
    "64": 0.3, // Finance - concentrated
    "65": 0.4, // Insurance - concentrated
    "70": 1.2, // Consulting - very fragmented
    "71": 1.0, // Engineering
    "72": 1.1, // Research
    "47": 0.7, // Retail
    "46": 0.8, // Wholesale
    "41": 1.0, // Construction
    "42": 0.9, // Civil engineering
    "86": 0.6, // Healthcare
    "85": 0.5, // Education
    "56": 1.1, // Food service
    "68": 0.9, // Real estate
    "35": 0.4, // Energy - concentrated
    "49": 0.8, // Transport
    "52": 0.9, // Logistics
  }

  const prefix = industryCode.substring(0, 2)
  return concentrations[prefix] || 1.0
}

// Keep all the existing helper functions (getIndustryMultiplier, getIndustryGrowthRate, etc.)
function getIndustryMultiplier(industryCode: string): number {
  const multipliers: { [key: string]: number } = {
    "62": 2.2, // Information technology
    "63": 2.0, // Information service activities
    "64": 2.5, // Financial services
    "65": 2.3, // Insurance
    "70": 1.8, // Management consulting
    "71": 1.6, // Architectural and engineering
    "72": 2.1, // Scientific research
    "47": 1.1, // Retail trade
    "46": 1.2, // Wholesale trade
    "41": 1.4, // Construction
    "42": 1.3, // Civil engineering
    "86": 1.0, // Healthcare
    "85": 0.9, // Education
    "56": 1.1, // Food service
    "68": 1.5, // Real estate
    "35": 1.7, // Electricity, gas, steam
    "49": 1.3, // Land transport
    "52": 1.4, // Warehousing and support
  }

  const prefix = industryCode.substring(0, 2)
  return multipliers[prefix] || 1.2
}

function getIndustryGrowthRate(industryCode: string): number {
  const growthRates: { [key: string]: number } = {
    "62": 15.2, // IT
    "63": 12.8, // Information services
    "64": 7.5, // Finance
    "65": 6.2, // Insurance
    "70": 9.8, // Consulting
    "71": 6.5, // Engineering
    "72": 11.2, // Research
    "47": 4.2, // Retail
    "46": 5.1, // Wholesale
    "41": 6.8, // Construction
    "42": 5.9, // Civil engineering
    "86": 3.8, // Healthcare
    "85": 2.9, // Education
    "56": 4.5, // Food service
    "68": 7.2, // Real estate
    "35": 8.5, // Energy
    "49": 5.2, // Transport
    "52": 6.1, // Logistics
  }

  const prefix = industryCode.substring(0, 2)
  return growthRates[prefix] || 6.5
}

function getValuationMultiple(industryCode: string): number {
  const multiples: { [key: string]: number } = {
    "62": 3.5, // IT - higher multiples
    "63": 3.2,
    "64": 2.8, // Finance
    "65": 2.5, // Insurance
    "70": 2.2, // Consulting
    "71": 1.8,
    "72": 2.5, // Research
    "47": 1.2, // Retail - lower multiples
    "46": 1.4,
    "41": 1.6, // Construction
    "42": 1.5,
    "86": 1.8, // Healthcare
    "85": 1.5, // Education
    "56": 1.3, // Food service
    "68": 2.0, // Real estate
    "35": 2.3, // Energy
    "49": 1.7, // Transport
    "52": 1.9, // Logistics
  }

  const prefix = industryCode.substring(0, 2)
  return multiples[prefix] || 1.8
}

function getInvestmentRating(
  employees: number,
  growthRate: number,
  vatRegistered: boolean,
  hasRealData: boolean,
): "BUY" | "HOLD" | "SELL" {
  let score = 0

  if (employees > 100) score += 2
  else if (employees > 50) score += 1
  else if (employees < 5) score -= 1

  if (growthRate > 10) score += 2
  else if (growthRate > 7) score += 1
  else if (growthRate < 3) score -= 1

  if (vatRegistered) score += 1
  if (hasRealData) score += 1

  if (score >= 4) return "BUY"
  if (score <= -1) return "SELL"
  return "HOLD"
}

function getRiskLevel(employees: number, growthRate: number, hasRealData: boolean): "LOW" | "MEDIUM" | "HIGH" {
  if (employees > 100 && growthRate > 5 && hasRealData) return "LOW"
  if (employees < 10 || growthRate < 2) return "HIGH"
  return "MEDIUM"
}

function createRevenueChartData(
  financialData: ProcessedFinancialData[],
  currentRevenue: number,
  growthRate: number,
  currentYear: number,
): Array<{ year: number; value: number; isReal?: boolean }> {
  const chartData: Array<{ year: number; value: number; isReal?: boolean }> = []

  // Add real data points
  financialData.forEach((data) => {
    if (data.revenue) {
      chartData.push({
        year: data.year,
        value: data.revenue,
        isReal: true,
      })
    }
  })

  // Fill in missing years with estimates
  for (let i = 4; i >= 0; i--) {
    const year = currentYear - i
    const existingData = chartData.find((d) => d.year === year)

    if (!existingData) {
      const estimatedValue = Math.round(currentRevenue * Math.pow(1 + growthRate / 100, i - 4))
      chartData.push({
        year,
        value: estimatedValue,
        isReal: false,
      })
    }
  }

  return chartData.sort((a, b) => a.year - b.year)
}

function createEmployeeChartData(
  financialData: ProcessedFinancialData[],
  currentEmployees: number,
  currentYear: number,
): Array<{ year: number; value: number; isReal?: boolean }> {
  const chartData: Array<{ year: number; value: number; isReal?: boolean }> = []

  // Add real data points
  financialData.forEach((data) => {
    if (data.employees) {
      chartData.push({
        year: data.year,
        value: data.employees,
        isReal: true,
      })
    }
  })

  // Fill in missing years with estimates
  for (let i = 4; i >= 0; i--) {
    const year = currentYear - i
    const existingData = chartData.find((d) => d.year === year)

    if (!existingData) {
      const estimatedValue = Math.max(1, Math.round(currentEmployees * Math.pow(1.05, i - 4)))
      chartData.push({
        year,
        value: estimatedValue,
        isReal: false,
      })
    }
  }

  return chartData.sort((a, b) => a.year - b.year)
}

function createProfitChartData(
  financialData: ProcessedFinancialData[],
  currentRevenue: number,
  currentYear: number,
): Array<{ year: number; value: number; isReal?: boolean }> {
  const chartData: Array<{ year: number; value: number; isReal?: boolean }> = []

  // Add real profit data points
  financialData.forEach((data) => {
    if (data.profit !== null) {
      chartData.push({
        year: data.year,
        value: data.profit,
        isReal: true,
      })
    }
  })

  // If we have some real data, don't estimate missing years for profit
  if (chartData.length > 0) {
    return chartData.sort((a, b) => a.year - b.year)
  }

  // Return empty array if no real profit data
  return []
}

function calculateActualGrowthRate(financialData: ProcessedFinancialData[]): number | null {
  if (financialData.length < 2) return null

  const revenueData = financialData.filter((d) => d.revenue !== null).sort((a, b) => a.year - b.year)

  if (revenueData.length < 2) return null

  const oldestRevenue = revenueData[0].revenue!
  const newestRevenue = revenueData[revenueData.length - 1].revenue!
  const years = revenueData[revenueData.length - 1].year - revenueData[0].year

  if (years === 0 || oldestRevenue === 0) return null

  const growthRate = (Math.pow(newestRevenue / oldestRevenue, 1 / years) - 1) * 100
  return Math.round(growthRate * 10) / 10
}
