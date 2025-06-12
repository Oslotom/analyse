"use client"

import { useState, useEffect } from "react"

interface LoadingAnimationProps {
  isLoading: boolean
}

const loadingMessages = [
  "Fetching company data from Brønnøysundregistrene...",
  "Accessing Regnskapsregisteret API for financial data...",
  "Processing official accounting statements...",
  "Extracting revenue, profit, and asset data...",
  "Calculating financial metrics and ratios...",
  "Sending comprehensive data to Hugging Face AI...",
  "AI generating detailed business analysis...",
  "Finalizing professional financial report...",
]

export default function LoadingAnimation({ isLoading }: LoadingAnimationProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0)
      setProgress(0)
      return
    }

    let currentProgress = 0
    const totalDuration = 12000 // 12 seconds to account for API calls
    const messageInterval = totalDuration / loadingMessages.length

    // Message and progress updates
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = (prev + 1) % loadingMessages.length
        return next
      })

      currentProgress += 100 / loadingMessages.length
      setProgress(Math.min(95, currentProgress)) // Cap at 95% until complete
    }, messageInterval)

    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating AI Report</h3>
        <p className="text-gray-600 transition-all duration-500 h-12 flex items-center justify-center text-sm">
          {loadingMessages[messageIndex]}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-6 mb-2">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500">{Math.round(progress)}% complete</p>

        <div className="mt-4 flex justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  )
}
