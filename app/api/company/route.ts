import { type NextRequest, NextResponse } from "next/server"
import type { BrregSearchResponse, CompanyData } from "@/types/company"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const suggestions = searchParams.get("suggestions") === "true"

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    console.log(`Searching for: ${query}, suggestions: ${suggestions}`)

    // If requesting suggestions, return multiple companies
    if (suggestions) {
      const apiUrl = `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(query.trim())}&size=10`
      console.log(`Suggestions API URL: ${apiUrl}`)

      const response = await fetch(apiUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "FinanceReport.no/1.0",
        },
      })

      if (!response.ok) {
        console.error(`API request failed: ${response.status} ${response.statusText}`)
        throw new Error(`API request failed: ${response.status}`)
      }

      const data: BrregSearchResponse = await response.json()
      console.log(`API Response:`, JSON.stringify(data, null, 2))

      if (data._embedded && data._embedded.enheter) {
        console.log(`Found ${data._embedded.enheter.length} companies`)
        return NextResponse.json(data._embedded.enheter)
      } else {
        console.log("No companies found in response")
        return NextResponse.json([])
      }
    }

    // Single company lookup
    const isOrgNumber = /^\d{9}$/.test(query.trim())
    console.log(`Is organization number: ${isOrgNumber}`)

    let apiUrl: string
    if (isOrgNumber) {
      apiUrl = `https://data.brreg.no/enhetsregisteret/api/enheter/${query.trim()}`
    } else {
      apiUrl = `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(query.trim())}&size=1`
    }

    console.log(`Single company API URL: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FinanceReport.no/1.0",
      },
    })

    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error(`Error response: ${errorText}`)
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Single company API Response:`, JSON.stringify(data, null, 2))

    // Handle different response formats
    let companyData: CompanyData
    if (isOrgNumber) {
      companyData = data
    } else {
      const searchResponse = data as BrregSearchResponse
      if (searchResponse._embedded && searchResponse._embedded.enheter && searchResponse._embedded.enheter.length > 0) {
        companyData = searchResponse._embedded.enheter[0]
      } else {
        console.log("Company not found in search results")
        return NextResponse.json({ error: "Company not found" }, { status: 404 })
      }
    }

    console.log(`Returning company data:`, JSON.stringify(companyData, null, 2))
    return NextResponse.json(companyData)
  } catch (error) {
    console.error("Error fetching company data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch company data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
