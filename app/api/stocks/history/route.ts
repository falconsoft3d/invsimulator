import { NextRequest, NextResponse } from "next/server"
import yahooFinance from "yahoo-finance2"

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const symbol = searchParams.get("symbol")
        const period = searchParams.get("period") || "1mo" // 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max
        
        if (!symbol) {
            return NextResponse.json(
                { error: "Symbol parameter is required" },
                { status: 400 }
            )
        }

        console.log(`🔍 Fetching historical data for: ${symbol} with period: ${period}`)

        // Mapear periodo a intervalo apropiado
        const intervalMap: Record<string, string> = {
            "1d": "5m",
            "5d": "15m",
            "1mo": "1d",
            "3mo": "1d",
            "6mo": "1d",
            "1y": "1wk",
            "2y": "1wk",
            "5y": "1mo",
            "max": "1mo"
        }

        const interval = intervalMap[period] || "1d"

        // Obtener datos históricos usando la forma correcta de yahoo-finance2
        const startDate = getPeriodStartDate(period)
        const endDate = new Date()
        
        console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`)
        console.log(`⏱️ Interval: ${interval}`)
        
        const queryOptions = {
            period1: startDate,
            period2: endDate,
            interval: interval as any
        }
        
        console.log(`🎯 Query options:`, queryOptions)
        
        const result = await yahooFinance.chart(symbol, queryOptions)

        console.log(`📊 Historical data result:`, result)
        console.log(`📊 Number of quotes:`, result?.quotes?.length || 0)

        if (!result || !result.quotes || result.quotes.length === 0) {
            return NextResponse.json(
                { error: "No historical data available" },
                { status: 404 }
            )
        }

        // Formatear datos para el gráfico
        const formattedData = result.quotes.map((quote: any) => ({
            date: quote.date.toISOString(),
            timestamp: quote.date.getTime(),
            open: quote.open || 0,
            high: quote.high || 0,
            low: quote.low || 0,
            close: quote.close || 0,
            volume: quote.volume || 0
        }))

        return NextResponse.json({
            symbol: result.meta.symbol,
            currency: result.meta.currency,
            exchangeName: result.meta.exchangeName,
            data: formattedData
        })
    } catch (error) {
        console.error("Error fetching historical data:", error)
        return NextResponse.json(
            { error: "Failed to fetch historical data", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}

function getPeriodStartDate(period: string): Date {
    const now = new Date()
    const startDate = new Date()

    switch (period) {
        case "1d":
            startDate.setDate(now.getDate() - 1)
            break
        case "5d":
            startDate.setDate(now.getDate() - 5)
            break
        case "1mo":
            startDate.setMonth(now.getMonth() - 1)
            break
        case "3mo":
            startDate.setMonth(now.getMonth() - 3)
            break
        case "6mo":
            startDate.setMonth(now.getMonth() - 6)
            break
        case "1y":
            startDate.setFullYear(now.getFullYear() - 1)
            break
        case "2y":
            startDate.setFullYear(now.getFullYear() - 2)
            break
        case "5y":
            startDate.setFullYear(now.getFullYear() - 5)
            break
        case "max":
            startDate.setFullYear(now.getFullYear() - 20)
            break
        default:
            startDate.setMonth(now.getMonth() - 1)
    }

    return startDate
}
