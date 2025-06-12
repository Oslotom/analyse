export interface CompanyData {
  organisasjonsnummer: string
  navn: string
  organisasjonsform?: {
    kode: string
    beskrivelse: string
  }
  registreringsdatoEnhetsregisteret?: string
  registrertIMvaregisteret?: boolean
  naeringskode1?: {
    beskrivelse: string
    kode: string
  }
  antallAnsatte?: number
  forretningsadresse?: {
    land: string
    landkode: string
    postnummer: string
    poststed: string
    adresse: string[]
    kommune: string
    kommunenummer: string
  }
  stiftelsesdato?: string
  institusjonellSektorkode?: {
    kode: string
    beskrivelse: string
  }
  registrertIForetaksregisteret?: boolean
  registrertIStiftelsesregisteret?: boolean
  registrertIFrivillighetsregisteret?: boolean
  konkurs?: boolean
  underAvvikling?: boolean
  underTvangsavviklingEllerTvangsopplosning?: boolean
  maalform?: string
  _links?: {
    self: {
      href: string
    }
  }
}

export interface BrregSearchResponse {
  _embedded?: {
    enheter: CompanyData[]
  }
  _links?: any
  page?: {
    size: number
    totalElements: number
    totalPages: number
    number: number
  }
}

export interface FinancialMetrics {
  revenue: number
  profit?: number
  operatingProfit?: number
  totalAssets?: number
  equity?: number
  debt?: number
  employees: number
  foundedYear: number
  industry: string
  legalForm: string
  registrationDate: string
  vatRegistered: boolean
  location: string
  hasRealFinancialData: boolean
  financialDataYear?: number
  currency?: string
  companySize?: "small" | "medium" | "large"
  isParentCompany?: boolean
}

// Update the existing FinancialReport interface to use the new FinancialMetrics
export interface FinancialReport {
  companyName: string
  organizationNumber: string
  keyMetrics: FinancialMetrics
  trendAnalysis: {
    growthRate: number
    marketPosition: string
    futureOutlook: string
  }
  competitorAnalysis: {
    marketShare: number
    competitiveAdvantage: string
    threats: string[]
  }
  swotAnalysis: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  investmentRecommendation: {
    rating: "BUY" | "HOLD" | "SELL"
    targetPrice: number
    reasoning: string
    riskLevel: "LOW" | "MEDIUM" | "HIGH"
  }
  chartData: {
    revenue: Array<{ year: number; value: number; isReal?: boolean }>
    employees: Array<{ year: number; value: number; isReal?: boolean }>
    marketShare: Array<{ category: string; value: number }>
    profit?: Array<{ year: number; value: number; isReal?: boolean }>
  }
}
