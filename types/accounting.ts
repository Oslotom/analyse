export interface AccountingData {
  id: number
  journalnr: string
  regnskapstype: string
  virksomhet: {
    organisasjonsnummer: string
    organisasjonsform: string
    morselskap: boolean
  }
  regnskapsperiode: {
    fraDato: string
    tilDato: string
  }
  valuta: string
  avviklingsregnskap: boolean
  oppstillingsplan: string
  revisjon: {
    ikkeRevidertAarsregnskap: boolean
    fravalgRevisjon: boolean
  }
  regnkapsprinsipper: {
    smaaForetak: boolean
    regnskapsregler: string
  }
  egenkapitalGjeld: {
    sumEgenkapitalGjeld: number
    egenkapital: {
      sumEgenkapital: number
      opptjentEgenkapital?: {
        sumOpptjentEgenkapital: number
      }
      innskuttEgenkapital?: {
        sumInnskuttEgenkaptial: number
      }
    }
    gjeldOversikt: {
      sumGjeld: number
      kortsiktigGjeld?: {
        sumKortsiktigGjeld: number
      }
      langsiktigGjeld?: {
        sumLangsiktigGjeld: number
      }
    }
  }
  eiendeler: {
    sumEiendeler: number
    omloepsmidler?: {
      sumOmloepsmidler: number
    }
    anleggsmidler?: {
      sumAnleggsmidler: number
    }
  }
  resultatregnskapResultat: {
    ordinaertResultatFoerSkattekostnad: number
    aarsresultat: number
    totalresultat: number
    finansresultat?: {
      nettoFinans: number
      finansinntekt?: {
        sumFinansinntekter: number
      }
      finanskostnad?: {
        sumFinanskostnad: number
      }
    }
    driftsresultat: {
      driftsresultat: number
      driftsinntekter: {
        sumDriftsinntekter: number
      }
      driftskostnad: {
        sumDriftskostnad: number
      }
    }
  }
}

export interface ProcessedFinancialData {
  revenue: number | null
  profit: number | null
  totalAssets: number | null
  equity: number | null
  debt: number | null
  currentAssets: number | null
  fixedAssets: number | null
  operatingProfit: number | null
  financialIncome: number | null
  financialCosts: number | null
  employees: number | null
  year: number
  currency: string
  hasRealData: boolean
  regnskapstype: string
  companySize: "small" | "medium" | "large"
  isParentCompany: boolean
}

export interface AccountingSearchResponse {
  _embedded?: {
    regnskap: AccountingData[]
  }
  _links?: any
  page?: {
    size: number
    totalElements: number
    totalPages: number
    number: number
  }
}

// Legacy interface for backward compatibility
export interface AccountingLine {
  regnskapslinjeId: string
  regnskapslinjenavn: string
  regnskapslinjenummer: string
  belop: number
}
