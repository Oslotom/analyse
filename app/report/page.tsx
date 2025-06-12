"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import type { FinancialReport } from "@/types/company"
import { ArrowLeft, TrendingUp, Users, Calendar, Building, Target, AlertTriangle, MapPin, Brain } from "lucide-react"

export default function ReportPage() {
  const [report, setReport] = useState<FinancialReport | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedReport = sessionStorage.getItem("financialReport")
    if (storedReport) {
      setReport(JSON.parse(storedReport))
    } else {
      router.push("/")
    }
  }, [router])

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "BUY":
        return "bg-green-100 text-green-800"
      case "HOLD":
        return "bg-yellow-100 text-yellow-800"
      case "SELL":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW":
        return "bg-green-100 text-green-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "HIGH":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("no-NO", {
      style: "currency",
      currency: "NOK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

  const swotData = [
    { subject: "Strengths", A: report.swotAnalysis.strengths.length * 20, fullMark: 100 },
    { subject: "Weaknesses", A: report.swotAnalysis.weaknesses.length * 15, fullMark: 100 },
    { subject: "Opportunities", A: report.swotAnalysis.opportunities.length * 25, fullMark: 100 },
    { subject: "Threats", A: report.swotAnalysis.threats.length * 18, fullMark: 100 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="flex items-center space-x-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Search</span>
            </Button>
            <div className="text-right">
              <h1 className="text-xl font-bold text-gray-900">{report.companyName}</h1>
              <div className="flex items-center justify-end space-x-2">
                <p className="text-sm text-gray-600">Org. Nr: {report.organizationNumber}</p>
                <Badge variant="outline" className="text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Enhanced
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600">Revenue</p>
                    {report.keyMetrics.hasRealFinancialData ? (
                      <Badge variant="secondary" className="text-xs">
                        Real Data {report.keyMetrics.financialDataYear}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Industry Estimate
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(report.keyMetrics.revenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add profit card if we have real profit data */}
          {report.keyMetrics.profit && report.keyMetrics.hasRealFinancialData && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-600">Profit</p>
                      <Badge variant="secondary" className="text-xs">
                        Real Data {report.keyMetrics.financialDataYear}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(report.keyMetrics.profit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-600">Employees</p>
                    {report.keyMetrics.hasRealFinancialData ? (
                      <Badge variant="secondary" className="text-xs">
                        Real Data
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Estimated
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{report.keyMetrics.employees.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Founded</p>
                  <p className="text-2xl font-bold text-gray-900">{report.keyMetrics.foundedYear}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Building className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Legal Form</p>
                  <p className="text-lg font-semibold text-gray-900">{report.keyMetrics.legalForm}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-lg font-semibold text-gray-900">{report.keyMetrics.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Details Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Company Information</span>
              <Badge variant="secondary" className="text-xs">
                <Brain className="w-3 h-3 mr-1" />
                Brønnøysundregistrene + AI Analysis
              </Badge>
            </CardTitle>
            <CardDescription>Official data enhanced with AI insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Industry</h4>
                <p className="text-gray-700">{report.keyMetrics.industry}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Registration Date</h4>
                <p className="text-gray-700">
                  {new Date(report.keyMetrics.registrationDate).toLocaleDateString("no-NO")}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">VAT Registration</h4>
                <Badge
                  className={
                    report.keyMetrics.vatRegistered ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }
                >
                  {report.keyMetrics.vatRegistered ? "VAT Registered" : "Not VAT Registered"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Revenue Trend</span>
                {report.keyMetrics.hasRealFinancialData && (
                  <Badge variant="secondary" className="text-xs">
                    Real Financial Data
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Historical and projected revenue growth</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Revenue (NOK)",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.chartData.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number, name: string, props: any) => [
                        formatCurrency(value),
                        `Revenue ${props.payload.isReal ? "(Real)" : "(Est.)"}`,
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-value)"
                      strokeWidth={3}
                      dot={(props: any) => {
                        const isReal = props.payload?.isReal
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={6}
                            fill={isReal ? "var(--color-value)" : "white"}
                            stroke="var(--color-value)"
                            strokeWidth={isReal ? 2 : 3}
                            strokeDasharray={isReal ? "0" : "5,5"}
                          />
                        )
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Profit Trend - only show if we have profit data */}
          {report.chartData.profit && report.chartData.profit.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Profit Trend</span>
                  <Badge variant="secondary" className="text-xs">
                    Real Financial Data
                  </Badge>
                </CardTitle>
                <CardDescription>Historical profit/loss performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Profit (NOK)",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report.chartData.profit}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value: number, name: string, props: any) => [
                          formatCurrency(value),
                          `Profit ${props.payload.isReal ? "(Real)" : "(Est.)"}`,
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--color-value)"
                        strokeWidth={3}
                        dot={(props: any) => {
                          const isReal = props.payload?.isReal
                          return (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={6}
                              fill={isReal ? "var(--color-value)" : "white"}
                              stroke="var(--color-value)"
                              strokeWidth={isReal ? 2 : 3}
                              strokeDasharray={isReal ? "0" : "5,5"}
                            />
                          )
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Employee Growth */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Growth</CardTitle>
              <CardDescription>Workforce development over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Employees",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.chartData.employees}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number, name: string, props: any) => [
                        value,
                        `Employees ${props.payload.isReal ? "(Real)" : "(Est.)"}`,
                      ]}
                    />
                    <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Market Share */}
          <Card>
            <CardHeader>
              <CardTitle>Market Position</CardTitle>
              <CardDescription>Company vs competitors market share</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report.chartData.marketShare}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {report.chartData.marketShare.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip formatter={(value: number) => [`${value}%`, "Market Share"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                {report.chartData.marketShare.map((entry, index) => (
                  <div key={entry.category} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {entry.category}: {entry.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SWOT Radar */}
          <Card>
            <CardHeader>
              <CardTitle>SWOT Analysis</CardTitle>
              <CardDescription>Strategic position radar chart</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={swotData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Score" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Trend Analysis</span>
                <Badge variant="outline" className="text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Enhanced
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Growth Rate</h4>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-green-600">{report.trendAnalysis.growthRate}%</div>
                  <span className="text-sm text-gray-600">annual growth</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Market Position</h4>
                <p className="text-gray-700">{report.trendAnalysis.marketPosition}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Future Outlook</h4>
                <p className="text-gray-700">{report.trendAnalysis.futureOutlook}</p>
              </div>
            </CardContent>
          </Card>

          {/* Investment Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Investment Recommendation</span>
                <Badge variant="outline" className="text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Enhanced
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Badge className={getRatingColor(report.investmentRecommendation.rating)}>
                  {report.investmentRecommendation.rating}
                </Badge>
                <Badge className={getRiskColor(report.investmentRecommendation.riskLevel)}>
                  {report.investmentRecommendation.riskLevel} RISK
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Target Valuation</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(report.investmentRecommendation.targetPrice)}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Reasoning</h4>
                <p className="text-gray-700">{report.investmentRecommendation.reasoning}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SWOT Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>SWOT Analysis</span>
              <Badge variant="outline" className="text-xs">
                <Brain className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
            </CardTitle>
            <CardDescription>Comprehensive strategic analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {report.swotAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="text-gray-700 flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-red-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  Weaknesses
                </h4>
                <ul className="space-y-2">
                  {report.swotAnalysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-gray-700 flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-blue-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Opportunities
                </h4>
                <ul className="space-y-2">
                  {report.swotAnalysis.opportunities.map((opportunity, index) => (
                    <li key={index} className="text-gray-700 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-orange-700 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Threats
                </h4>
                <ul className="space-y-2">
                  {report.swotAnalysis.threats.map((threat, index) => (
                    <li key={index} className="text-gray-700 flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      {threat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitor Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Competitive Analysis</span>
              <Badge variant="outline" className="text-xs">
                <Brain className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Market Share</h4>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-blue-600">{report.competitorAnalysis.marketShare}%</div>
                <span className="text-sm text-gray-600">of total market</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Competitive Advantage</h4>
              <p className="text-gray-700">{report.competitorAnalysis.competitiveAdvantage}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Key Threats</h4>
              <ul className="space-y-1">
                {report.competitorAnalysis.threats.map((threat, index) => (
                  <li key={index} className="text-gray-700 flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    {threat}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
