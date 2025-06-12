"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { CompanyData } from "@/types/company"
import { Search, Building2, MapPin } from "lucide-react"

interface CompanySearchProps {
  onCompanySelect: (company: CompanyData) => void
  isLoading: boolean
}

export default function CompanySearch({ onCompanySelect, isLoading }: CompanySearchProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<CompanyData[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounced search for suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchSuggestions(query.trim())
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const searchSuggestions = async (searchQuery: string) => {
    setIsSearching(true)
    try {
      const response = await fetch(`/api/company?q=${encodeURIComponent(searchQuery)}&suggestions=true`)
      if (response.ok) {
        const companies: CompanyData[] = await response.json()
        setSuggestions(companies)
        setShowSuggestions(companies.length > 0)
        setSelectedIndex(-1)
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleSuggestionClick = (company: CompanyData) => {
    setQuery(`${company.navn} (${company.organisasjonsnummer})`)
    setShowSuggestions(false)
    onCompanySelect(company)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (suggestions.length > 0 && selectedIndex === -1) {
      // If there are suggestions but none selected, select the first one
      handleSuggestionClick(suggestions[0])
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const formatAddress = (company: CompanyData) => {
    if (!company.forretningsadresse) return ""
    const addr = company.forretningsadresse
    return `${addr.poststed || ""}, ${addr.kommune || ""}`.replace(/^,\s*|,\s*$/g, "")
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for Norwegian companies (e.g., 'Equinor', 'DNB', or organization number)"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          className="w-full h-14 pl-12 pr-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-all duration-300 hover:border-gray-300 shadow-sm"
          disabled={isLoading}
        />

        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.map((company, index) => (
            <div
              key={company.organisasjonsnummer}
              onClick={() => handleSuggestionClick(company)}
              className={`p-4 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? "bg-blue-50 border-blue-200" : ""
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{company.navn}</h4>
                    <span className="text-xs text-gray-500 ml-2">{company.organisasjonsnummer}</span>
                  </div>

                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-600">
                    {company.organisasjonsform?.beskrivelse && (
                      <span className="bg-gray-100 px-2 py-1 rounded">{company.organisasjonsform.beskrivelse}</span>
                    )}

                    {company.naeringskode1?.beskrivelse && (
                      <span className="truncate">{company.naeringskode1.beskrivelse}</span>
                    )}
                  </div>

                  {formatAddress(company) && (
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <MapPin className="w-3 h-3 mr-1" />
                      {formatAddress(company)}
                    </div>
                  )}

                  {company.antallAnsatte && (
                    <div className="mt-1 text-xs text-gray-500">{company.antallAnsatte} employees</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="submit"
        disabled={!query.trim() || isLoading}
        className="w-full h-14 text-lg font-semibold rounded-2xl bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:transform-none disabled:hover:bg-blue-600 mt-4"
      >
        {isLoading ? "Generating Report..." : "Generate Financial Report"}
      </Button>
    </form>
  )
}
