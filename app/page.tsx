"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import LoadingAnimation from "@/components/loading-animation"
import type { CompanyData, FinancialReport } from "@/types/company"
import CompanySearch from "@/components/company-search"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleCompanySelect = async (companyData: CompanyData) => {
    setIsLoading(true)
    setError("")

    try {
      console.log("Selected company:", companyData.navn)

      // Generate AI report
      const reportResponse = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyData }),
      })

      if (!reportResponse.ok) {
        const errorData = await reportResponse.json()
        throw new Error(errorData.error || errorData.details || "Failed to generate report")
      }

      const reportData: FinancialReport = await reportResponse.json()

      if (!reportData || !reportData.keyMetrics) {
        throw new Error("Invalid report data received")
      }

      // Store report data in sessionStorage and navigate
      sessionStorage.setItem("financialReport", JSON.stringify(reportData))
      router.push("/report")
    } catch (err) {
      console.error("Error in handleCompanySelect:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <LoadingAnimation isLoading={isLoading} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FR</span>
              </div>
              <span className="text-xl font-bold text-gray-900">FinanceReport.no</span>
            </div>
            <div className="hidden md:flex space-x-6">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">
                About
              </a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                Contact
              </a>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              AI-Powered Financial Reports for
              <span className="text-blue-600 block">Norwegian Companies</span>
            </h1>

            <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              Get comprehensive financial analysis with authenticated access to official accounting data, market
              insights, and AI-powered investment recommendations for any Norwegian company in seconds.
            </p>

            <div className="flex items-center justify-center mb-12">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center">
                <img
                  src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
                  alt="Hugging Face"
                  className="h-6 mr-2"
                />
                <span className="text-sm text-gray-700">
                  Powered by Hugging Face AI and authenticated Norwegian financial data
                </span>
              </div>
            </div>

            {/* Search Form */}
            <div className="max-w-2xl mx-auto mb-8">
              <CompanySearch onCompanySelect={handleCompanySelect} isLoading={isLoading} />

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Official Financial Data</h3>
                <p className="text-gray-600">
                  Direct access to Regnskapsregisteret API for official financial statements, revenue, profit, and asset
                  data
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Analysis</h3>
                <p className="text-gray-600">
                  Mixtral-8x7B AI model generates comprehensive financial insights based on real accounting data
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Reports</h3>
                <p className="text-gray-600">
                  Complete financial analysis with interactive charts, SWOT analysis, and investment recommendations
                </p>
              </div>
            </div>

            {/* Data Sources */}
            <div className="mt-16 bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Trusted Data Sources</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Brønnøysundregistrene</h4>
                    <p className="text-gray-600">Official company registration data</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Regnskapsregisteret API</h4>
                    <p className="text-gray-600">Official financial statements and accounting data via REST API</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-gray-200 mt-16">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 FinanceReport.no. Powered by AI and authenticated Norwegian business data.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
