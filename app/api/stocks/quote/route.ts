import { NextResponse } from "next/server"
import YahooFinance from "yahoo-finance2"

const yahooFinance = new YahooFinance()

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const symbol = searchParams.get("symbol")

        if (!symbol) {
            return NextResponse.json({ error: "Symbol parameter is required" }, { status: 400 })
        }

        console.log("Fetching quote for:", symbol)

        // Obtener cotización actual
        const quote = await yahooFinance.quote(symbol)

        console.log("Quote result:", JSON.stringify(quote, null, 2))

        if (!quote) {
            return NextResponse.json({ error: "Stock not found" }, { status: 404 })
        }

        // Formatear la respuesta
        const stockData = {
            symbol: quote.symbol,
            name: quote.longName || quote.shortName || quote.symbol,
            price: quote.regularMarketPrice,
            previousClose: quote.regularMarketPreviousClose,
            open: quote.regularMarketOpen,
            dayHigh: quote.regularMarketDayHigh,
            dayLow: quote.regularMarketDayLow,
            volume: quote.regularMarketVolume,
            marketCap: quote.marketCap,
            currency: quote.currency,
            exchange: quote.fullExchangeName,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
        }

        return NextResponse.json(stockData)
    } catch (error) {
        console.error("Error fetching quote:", error)
        return NextResponse.json(
            { error: "Failed to fetch stock quote", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
