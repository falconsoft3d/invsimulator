import { NextResponse } from "next/server"
import YahooFinance from "yahoo-finance2"

const yahooFinance = new YahooFinance()

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get("q")

        if (!query || query.length < 1) {
            return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
        }

        console.log("Searching for:", query)

        // Buscar símbolos usando Yahoo Finance
        const searchResults = await yahooFinance.search(query)

        console.log("Search results:", JSON.stringify(searchResults, null, 2))

        // Formatear los resultados
        const stocks = (searchResults.quotes || []).map((quote: any) => ({
            symbol: quote.symbol,
            name: quote.longname || quote.shortname || quote.symbol,
            exchange: quote.exchange,
            type: quote.quoteType,
        }))

        console.log("Formatted stocks:", stocks)

        return NextResponse.json(stocks)
    } catch (error) {
        console.error("Error searching stocks:", error)
        return NextResponse.json(
            { error: "Failed to search stocks", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
