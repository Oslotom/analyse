import { type NextRequest, NextResponse } from "next/server"
import type { AccountingData, ProcessedFinancialData } from "@/types/accounting"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orgnr = searchParams.get("orgnr")

  if (!orgnr) {
    return NextResponse.json({ error: "Organization number is required" }, { status: 400 })
  }

  try {
    console.log(`Fetching accounting data for: ${orgnr}`)

    // Use the correct API endpoint from the Swagger documentation
    const apiUrl = `https://data.brreg.no/regnskapsregisteret/regnskap/${orgnr}`
    console.log(`Accounting API URL: ${apiUrl}`)

    // Try multiple approaches based on the Swagger documentation
    const authAttempts = [
      // Attempt 1: No authentication (check if public access is available)
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "FinanceReport.no/1.0",
        },
        description: "Public access",
      },
      // Attempt 2: Basic Auth with test credentials
      {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from("test200:test").toString("base64")}`,
          "User-Agent": "FinanceReport.no/1.0",
        },
        description: "Basic Auth test200:test",
      },
    ]

    let successfulResponse = null
    let lastError = null

    for (const attempt of authAttempts) {
      try {
        console.log(`Attempting: ${attempt.description}`)

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: attempt.headers,
        })

        console.log(`Response status: ${response.status}`)
        console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))

        if (response.ok) {
          const data = await response.json()
          console.log(`Success with ${attempt.description}`)
          console.log(`Response data type:`, typeof data)
          console.log(`Response is array:`, Array.isArray(data))
          if (Array.isArray(data) && data.length > 0) {
            console.log(`First record keys:`, Object.keys(data[0]))
          }
          successfulResponse = data
          break
        } else if (response.status === 404) {
          console.log(`No accounting data found for organization ${orgnr}`)
          return NextResponse.json(
            {
              error: "No accounting data available",
              hasRealData: false,
              message: "Company has not published financial statements or data is not publicly available",
              suggestion: "Analysis will use company registration data and industry estimates",
            },
            { status: 404 },
          )
        } else if (response.status === 401 || response.status === 403) {
          console.log(`Authentication failed with ${attempt.description}: ${response.status}`)
          lastError = `Authentication failed: ${response.status}`
          continue
        } else {
          console.log(`Request failed with ${attempt.description}: ${response.status}`)
          const errorText = await response.text()
          lastError = `API error: ${response.status} - ${errorText.substring(0, 200)}`
          continue
        }
      } catch (error) {
        console.log(`Error with ${attempt.description}:`, error)
        lastError = error instanceof Error ? error.message : "Unknown error"
        continue
      }
    }

    if (!successfulResponse) {
      console.log("All authentication attempts failed")
      return NextResponse.json(
        {
          error: "Unable to access accounting data",
          hasRealData: false,
          message: "Financial statements require authenticated access or are not publicly available",
          suggestion: "Analysis will use company registration data and industry estimates",
          details: lastError,
        },
        { status: 403 },
      )
    }

    console.log(`API Response received, processing structured data...`)

    let accountingData: AccountingData[] = []

    // Handle the structured response format
    if (Array.isArray(successfulResponse)) {
      console.log(`Response is array with ${successfulResponse.length} items`)
      accountingData = successfulResponse
    } else if (successfulResponse._embedded && successfulResponse._embedded.regnskap) {
      console.log(`Response has _embedded.regnskap with ${successfulResponse._embedded.regnskap.length} items`)
      accountingData = successfulResponse._embedded.regnskap
    } else if (successfulResponse.id && successfulResponse.virksomhet) {
      console.log("Response is single accounting record")
      accountingData = [successfulResponse]
    } else {
      console.log("Unexpected response format:", JSON.stringify(successfulResponse, null, 2).substring(0, 500))
      return NextResponse.json(
        {
          error: "Unexpected response format",
          hasRealData: false,
          message: "Unable to parse accounting data from API response",
          suggestion: "Analysis will use company registration data and industry estimates",
          details: `Response keys: ${Object.keys(successfulResponse).join(", ")}`,
        },
        { status: 500 },
      )
    }

    if (accountingData.length === 0) {
      console.log("No accounting records found in response")
      return NextResponse.json(
        {
          error: "No accounting data available",
          hasRealData: false,
          message: "No financial statements found for this company",
          suggestion: "Analysis will use company registration data and industry estimates",
        },
        { status: 404 },
      )
    }

    console.log(`Successfully fetched ${accountingData.length} accounting records`)

    // Log the structure of the first record for debugging
    if (accountingData.length > 0) {
      const firstRecord = accountingData[0]
      console.log("First record structure:")
      console.log(`- ID: ${firstRecord.id}`)
      console.log(`- Organisation: ${firstRecord.virksomhet?.organisasjonsnummer}`)
      console.log(`- Type: ${firstRecord.regnskapstype}`)
      console.log(`- Period: ${firstRecord.regnskapsperiode?.fraDato} to ${firstRecord.regnskapsperiode?.tilDato}`)
      console.log(`- Currency: ${firstRecord.valuta}`)
      console.log(
        `- Revenue: ${firstRecord.resultatregnskapResultat?.driftsresultat?.driftsinntekter?.sumDriftsinntekter}`,
      )
      console.log(`- Profit: ${firstRecord.resultatregnskapResultat?.aarsresultat}`)
      console.log(`- Assets: ${firstRecord.eiendeler?.sumEiendeler}`)
      console.log(`- Equity: ${firstRecord.egenkapitalGjeld?.egenkapital?.sumEgenkapital}`)
    }

    // Process the structured accounting data
    const processedData = processStructuredAccountingData(accountingData)
    console.log(`Processed ${processedData.length} years of financial data`)

    if (processedData.length === 0) {
      return NextResponse.json(
        {
          error: "No usable financial data found",
          hasRealData: false,
          message: "Financial statements found but could not extract usable metrics",
          suggestion: "Analysis will use company registration data and industry estimates",
          details: "Unable to extract financial metrics from structured data",
        },
        { status: 404 },
      )
    }

    // Log the processed data summary
    processedData.forEach((data, index) => {
      console.log(
        `Year ${data.year}: Revenue=${data.revenue ? (data.revenue / 1000000).toFixed(1) + "M" : "N/A"} NOK, Profit=${data.profit ? (data.profit / 1000000).toFixed(1) + "M" : "N/A"} NOK, Assets=${data.totalAssets ? (data.totalAssets / 1000000).toFixed(1) + "M" : "N/A"} NOK, Equity=${data.equity ? (data.equity / 1000000).toFixed(1) + "M" : "N/A"} NOK`,
      )
    })

    return NextResponse.json(processedData)
  } catch (error) {
    console.error("Error fetching accounting data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch accounting data",
        details: error instanceof Error ? error.message : "Unknown error",
        hasRealData: false,
        message: "Unable to connect to accounting register",
        suggestion: "Analysis will use company registration data and industry estimates",
      },
      { status: 500 },
    )
  }
}

function processStructuredAccountingData(accountingRecords: AccountingData[]): ProcessedFinancialData[] {
  return accountingRecords
    .map((record) => {
      try {
        console.log(`Processing structured record for org: ${record.virksomhet?.organisasjonsnummer}`)

        const year = record.regnskapsperiode?.tilDato
          ? new Date(record.regnskapsperiode.tilDato).getFullYear()
          : new Date().getFullYear()

        console.log(`Processing year: ${year}`)

        // Extract financial data from structured format
        const revenue = record.resultatregnskapResultat?.driftsresultat?.driftsinntekter?.sumDriftsinntekter || null
        const profit = record.resultatregnskapResultat?.aarsresultat || null
        const operatingProfit = record.resultatregnskapResultat?.driftsresultat?.driftsresultat || null
        const totalAssets = record.eiendeler?.sumEiendeler || null
        const equity = record.egenkapitalGjeld?.egenkapital?.sumEgenkapital || null
        const debt = record.egenkapitalGjeld?.gjeldOversikt?.sumGjeld || null
        const currentAssets = record.eiendeler?.omloepsmidler?.sumOmloepsmidler || null
        const fixedAssets = record.eiendeler?.anleggsmidler?.sumAnleggsmidler || null
        const financialIncome =
          record.resultatregnskapResultat?.finansresultat?.finansinntekt?.sumFinansinntekter || null
        const financialCosts = record.resultatregnskapResultat?.finansresultat?.finanskostnad?.sumFinanskostnad || null

        // Determine company size based on Norwegian accounting standards
        const companySize: "small" | "medium" | "large" = record.regnkapsprinsipper?.smaaForetak
          ? "small"
          : record.oppstillingsplan === "store"
            ? "large"
            : "medium"

        const isParentCompany = record.virksomhet?.morselskap || false

        console.log(
          `Extracted structured values - Revenue: ${revenue ? (revenue / 1000000).toFixed(1) + "M" : "N/A"}, Profit: ${profit ? (profit / 1000000).toFixed(1) + "M" : "N/A"}, Operating Profit: ${operatingProfit ? (operatingProfit / 1000000).toFixed(1) + "M" : "N/A"}, Assets: ${totalAssets ? (totalAssets / 1000000).toFixed(1) + "M" : "N/A"}, Equity: ${equity ? (equity / 1000000).toFixed(1) + "M" : "N/A"}, Debt: ${debt ? (debt / 1000000).toFixed(1) + "M" : "N/A"}`,
        )

        const hasRealData = revenue !== null || profit !== null || totalAssets !== null

        if (!hasRealData) {
          console.log("No financial metrics found in structured data")
          return null
        }

        return {
          revenue,
          profit,
          totalAssets,
          equity,
          debt,
          currentAssets,
          fixedAssets,
          operatingProfit,
          financialIncome,
          financialCosts,
          employees: null, // Not available in this structured format
          year,
          currency: record.valuta || "NOK",
          hasRealData,
          regnskapstype: record.regnskapstype || "unknown",
          companySize,
          isParentCompany,
        }
      } catch (recordError) {
        console.error("Error processing structured accounting record:", recordError)
        return null
      }
    })
    .filter((data): data is ProcessedFinancialData => data !== null)
    .sort((a, b) => b.year - a.year) // Sort by year, newest first
}
