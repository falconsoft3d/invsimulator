"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Trash2, X, RefreshCw, DollarSign, ShoppingCart, TrendingDown, Search, Plus, Eye, EyeOff, ChevronDown, ChevronUp, TrendingUpIcon, BarChart3 } from "lucide-react"
import TableTemplate from "@/components/TableTemplate"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Bar } from "recharts"

// Componente personalizado para velas japonesas
const CandleStick = (props: any) => {
    const { x, y, width, height, low, high, openClose, fill } = props
    const isGrowing = openClose[1] > openClose[0]
    const color = isGrowing ? "#10b981" : "#ef4444"
    const ratio = Math.abs(height / (openClose[0] - openClose[1]))
    
    return (
        <g stroke={color} fill="none" strokeWidth="2">
            {/* Línea vertical (mecha) */}
            <path
                d={`
                    M ${x + width / 2},${y}
                    L ${x + width / 2},${y + height}
                `}
            />
            {/* Cuerpo de la vela */}
            <rect
                x={x + width * 0.2}
                y={isGrowing ? y + (1 - ratio) * height : y}
                width={width * 0.6}
                height={ratio * height || 1}
                fill={color}
                stroke={color}
            />
        </g>
    )
}

interface Journal {
    id: string
    code: string
    name: string
    currency?: {
        id: string
        symbol: string
    }
}

interface Investment {
    id: string
    symbol: string
    name: string
    shares: number
    buyPrice: number
    currentPrice: number
    totalInvested: number
    currentValue: number
    profitLoss: number
    profitLossPercent: number
    buyDate: string
    journalId?: string | null
    journal?: Journal | null
    status: string
    createdAt: string
}

interface Stock {
    symbol: string
    name: string
}

interface Favorite {
    id: string
    symbol: string
    name: string
    note?: string | null
    createdAt: string
}

// Lista de acciones populares
const POPULAR_STOCKS: Stock[] = [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "MSFT", name: "Microsoft Corporation" },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "AMZN", name: "Amazon.com Inc." },
    { symbol: "TSLA", name: "Tesla Inc." },
    { symbol: "META", name: "Meta Platforms Inc." },
    { symbol: "NVDA", name: "NVIDIA Corporation" },
    { symbol: "JPM", name: "JPMorgan Chase & Co." },
    { symbol: "V", name: "Visa Inc." },
    { symbol: "JNJ", name: "Johnson & Johnson" },
    { symbol: "WMT", name: "Walmart Inc." },
    { symbol: "PG", name: "Procter & Gamble Co." },
    { symbol: "MA", name: "Mastercard Inc." },
    { symbol: "UNH", name: "UnitedHealth Group Inc." },
    { symbol: "HD", name: "The Home Depot Inc." },
    { symbol: "DIS", name: "The Walt Disney Company" },
    { symbol: "BAC", name: "Bank of America Corp." },
    { symbol: "NFLX", name: "Netflix Inc." },
    { symbol: "ADBE", name: "Adobe Inc." },
    { symbol: "CRM", name: "Salesforce Inc." },
    { symbol: "CSCO", name: "Cisco Systems Inc." },
    { symbol: "INTC", name: "Intel Corporation" },
    { symbol: "PEP", name: "PepsiCo Inc." },
    { symbol: "KO", name: "The Coca-Cola Company" },
    { symbol: "NKE", name: "Nike Inc." },
    { symbol: "MCD", name: "McDonald's Corporation" },
    { symbol: "PYPL", name: "PayPal Holdings Inc." },
    { symbol: "ORCL", name: "Oracle Corporation" },
    { symbol: "AMD", name: "Advanced Micro Devices Inc." },
    { symbol: "IBM", name: "International Business Machines" },
]

export default function InvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([])
    const [journals, setJournals] = useState<Journal[]>([])
    const [loading, setLoading] = useState(true)
    const [isTrading, setIsTrading] = useState(false)
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
    const [searchQuery, setSearchQuery] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [searchResults, setSearchResults] = useState<Stock[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null)
    const [confirmMessage, setConfirmMessage] = useState("")
    const [confirmTitle, setConfirmTitle] = useState("")
    const [brokerBuyCommission, setBrokerBuyCommission] = useState(0)
    const [brokerSellCommission, setBrokerSellCommission] = useState(0)
    const [favorites, setFavorites] = useState<Favorite[]>([])
    const [showFavoritesForm, setShowFavoritesForm] = useState(false)
    const [favoriteSearch, setFavoriteSearch] = useState("")
    const [favoriteSearchResults, setFavoriteSearchResults] = useState<Stock[]>([])
    const [isSearchingFavorite, setIsSearchingFavorite] = useState(false)
    const [availableCapital, setAvailableCapital] = useState(0)
    const [hiddenInvestments, setHiddenInvestments] = useState<Set<string>>(new Set())
    const [showHidden, setShowHidden] = useState(false)
    const [showStockExplorer, setShowStockExplorer] = useState(false)
    const [explorerSearchQuery, setExplorerSearchQuery] = useState("")
    const [explorerSearchResults, setExplorerSearchResults] = useState<Stock[]>([])
    const [isExplorerSearching, setIsExplorerSearching] = useState(false)
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
    const [stockQuote, setStockQuote] = useState<{
        price?: number
        change?: number
        changePercent?: number
        volume?: number
    } | null>(null)
    const [historicalData, setHistoricalData] = useState<{
        date: string
        timestamp: number
        open: number
        high: number
        low: number
        close: number
        volume: number
    }[]>([])
    const [chartType, setChartType] = useState<"line" | "candlestick">("line")
    const [chartPeriod, setChartPeriod] = useState<string>("1mo")
    const [isLoadingChart, setIsLoadingChart] = useState(false)
    const [favoriteChartData, setFavoriteChartData] = useState<Record<string, any[]>>({})
    const [favoriteQuotes, setFavoriteQuotes] = useState<Record<string, any>>({})
    const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(new Set())
    const [tradeData, setTradeData] = useState({
        symbol: "",
        name: "",
        shares: 0,
        price: 0,
        journalId: ""
    })
    const [currentInvestment, setCurrentInvestment] = useState<Partial<Investment>>({})

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [investmentRes, journalRes, settingsRes, favoritesRes, paymentsRes, userRes] = await Promise.all([
                fetch("/api/investments"),
                fetch("/api/journals"),
                fetch("/api/settings"),
                fetch("/api/favorites"),
                fetch("/api/payments"),
                fetch("/api/user/profile")
            ])

            if (investmentRes.ok && journalRes.ok) {
                const investmentsData = await investmentRes.json()
                const journalsData = await journalRes.json()
                setInvestments(investmentsData)
                setJournals(journalsData)
            }

            if (settingsRes.ok) {
                const settingsData = await settingsRes.json()
                const buyCommission = settingsData.find((s: any) => s.key === "broker_buy_commission")
                const sellCommission = settingsData.find((s: any) => s.key === "broker_sell_commission")
                setBrokerBuyCommission(parseFloat(buyCommission?.value || "0"))
                setBrokerSellCommission(parseFloat(sellCommission?.value || "0"))
            }

            if (favoritesRes.ok) {
                const favoritesData = await favoritesRes.json()
                setFavorites(favoritesData)
                
                // Cargar datos de cotización y gráficos para cada favorito
                favoritesData.forEach((fav: Favorite) => {
                    loadFavoriteData(fav.symbol)
                })
            }

            // Calcular capital disponible solo para el usuario actual
            if (paymentsRes.ok && userRes.ok) {
                const paymentsData = await paymentsRes.json()
                const currentUser = await userRes.json()
                
                // Filtrar pagos del usuario actual
                const userPayments = paymentsData.filter((p: any) => p.userId === currentUser.id)
                
                const totalEntradas = userPayments
                    .filter((p: any) => p.type === "Entrada")
                    .reduce((sum: number, p: any) => sum + Number(p.amount), 0)
                const totalSalidas = userPayments
                    .filter((p: any) => p.type === "Salida")
                    .reduce((sum: number, p: any) => sum + Number(p.amount), 0)
                
                // Capital = Entradas - Salidas
                const capital = totalEntradas - totalSalidas
                setAvailableCapital(capital)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        setConfirmTitle("Eliminar Inversión")
        setConfirmMessage("¿Está seguro de eliminar esta inversión permanentemente? Esta acción no se puede deshacer.")
        setConfirmAction(() => async () => {
            try {
                const res = await fetch(`/api/investments/${id}`, {
                    method: "DELETE",
                })
                if (res.ok) {
                    await fetchData()
                }
            } catch (error) {
                console.error("Error deleting investment:", error)
            }
            setShowConfirmModal(false)
        })
        setShowConfirmModal(true)
    }

    const toggleInvestmentVisibility = (id: string) => {
        setHiddenInvestments(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const handleCloseOperation = async (investment: Investment) => {
        if (investment.status !== "activa") {
            // Si ya está finalizada, solo eliminar
            setConfirmTitle("Eliminar Operación Finalizada")
            setConfirmMessage("¿Eliminar esta operación finalizada de la lista?")
            setConfirmAction(() => async () => {
                try {
                    const res = await fetch(`/api/investments/${investment.id}`, {
                        method: "DELETE",
                    })
                    if (res.ok) {
                        await fetchData()
                    }
                } catch (error) {
                    console.error("Error closing operation:", error)
                }
                setShowConfirmModal(false)
            })
            setShowConfirmModal(true)
            return
        }

        const shares = Number(investment.shares)
        const isShortPosition = shares < 0 // Posición corta si shares es negativo
        const absShares = Math.abs(shares)
        
        // Obtener usuario actual
        const userRes = await fetch("/api/user/profile")
        const currentUser = await userRes.json()

        if (isShortPosition) {
            // Cerrar posición corta: comprar acciones para cubrir
            const buyValue = absShares * Number(investment.currentPrice)
            const commission = buyValue * (brokerBuyCommission / 100)
            const totalCost = buyValue + commission

            setConfirmTitle("Cerrar Posición Corta")
            setConfirmMessage(
                `¿Cerrar posición corta comprando ${absShares} acciones de ${investment.symbol} a $${Number(investment.currentPrice).toFixed(2)}?\n\n` +
                `Costo bruto: $${buyValue.toFixed(2)}\n` +
                `Comisión (${brokerBuyCommission}%): +$${commission.toFixed(2)}\n` +
                `Costo total: $${totalCost.toFixed(2)}`
            )
            setConfirmAction(() => async () => {
                try {
                    // Crear pago de salida (costo de recompra + comisión)
                    if (investment.journalId) {
                        await fetch("/api/payments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                type: "Salida",
                                journalId: investment.journalId,
                                amount: totalCost,
                                reference: `Cierre posición corta comprando ${absShares} acciones de ${investment.symbol} a $${Number(investment.currentPrice).toFixed(2)} (incluyendo comisión de $${commission.toFixed(2)})`,
                                date: new Date().toISOString(),
                                userId: currentUser.id
                            })
                        })
                    }

                    // Eliminar la inversión
                    await fetch(`/api/investments/${investment.id}`, {
                        method: "DELETE",
                    })

                    await fetchData()
                } catch (error) {
                    console.error("Error closing short position:", error)
                }
                setShowConfirmModal(false)
            })
        } else {
            // Cerrar posición larga: vender acciones
            const sellValue = absShares * Number(investment.currentPrice)
            const commission = sellValue * (brokerSellCommission / 100)
            const netSellValue = sellValue - commission

            setConfirmTitle("Cerrar Operación")
            setConfirmMessage(
                `¿Cerrar esta operación vendiendo ${absShares} acciones de ${investment.symbol} a $${Number(investment.currentPrice).toFixed(2)}?\n\n` +
                `Valor bruto: $${sellValue.toFixed(2)}\n` +
                `Comisión (${brokerSellCommission}%): -$${commission.toFixed(2)}\n` +
                `Valor neto: $${netSellValue.toFixed(2)}`
            )
            setConfirmAction(() => async () => {
                try {
                    // Crear pago de entrada (ingreso por venta - comisión)
                    if (investment.journalId) {
                        await fetch("/api/payments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                type: "Entrada",
                                journalId: investment.journalId,
                                amount: netSellValue,
                                reference: `Venta (cierre) de ${absShares} acciones de ${investment.symbol} a $${Number(investment.currentPrice).toFixed(2)} (descontando comisión de $${commission.toFixed(2)})`,
                                date: new Date().toISOString(),
                                userId: currentUser.id
                            })
                        })
                    }

                    // Eliminar la inversión
                    await fetch(`/api/investments/${investment.id}`, {
                        method: "DELETE",
                    })

                    await fetchData()
                } catch (error) {
                    console.error("Error closing operation:", error)
                }
                setShowConfirmModal(false)
            })
        }
        
        setShowConfirmModal(true)
    }



    const handleUpdatePrice = async (id: string, newPrice: number) => {
        try {
            const res = await fetch(`/api/investments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPrice: newPrice }),
            })

            if (res.ok) {
                await fetchData()
            }
        } catch (error) {
            console.error("Error updating price:", error)
        }
    }

    const handleBuy = () => {
        setTradeType('buy')
        setTradeData({
            symbol: "",
            name: "",
            shares: 0,
            price: 0,
            journalId: ""
        })
        setSearchQuery("")
        setShowSuggestions(false)
        setSearchResults([])
        setIsTrading(true)
    }

    const handleSell = (investment?: Investment) => {
        setTradeType('sell')
        if (investment) {
            // Venta de inversión existente
            setTradeData({
                symbol: investment.symbol,
                name: investment.name,
                shares: Number(investment.shares),
                price: Number(investment.currentPrice),
                journalId: investment.journalId || ""
            })
            setSearchQuery(investment.symbol + " - " + investment.name)
            setCurrentInvestment(investment)
        } else {
            // Venta en corto (nueva posición)
            setTradeData({
                symbol: "",
                name: "",
                shares: 0,
                price: 0,
                journalId: ""
            })
            setSearchQuery("")           
            setCurrentInvestment({})
        }
        setShowSuggestions(false)
        setSearchResults([])
        setIsTrading(true)
    }

    const handleSearchChange = async (value: string) => {
        setSearchQuery(value)
        
        if (value.length < 1) {
            setShowSuggestions(false)
            setSearchResults([])
            return
        }

        setShowSuggestions(true)
        setIsSearching(true)

        try {
            const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(value)}`)
            if (response.ok) {
                const stocks = await response.json()
                setSearchResults(stocks || [])
            } else {
                setSearchResults([])
            }
        } catch (error) {
            console.error("Error searching stocks:", error)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    const handleSelectStock = async (stock: Stock) => {
        setSearchQuery(stock.symbol + " - " + stock.name)
        setShowSuggestions(false)
        
        // Obtener precio actual de la acción
        try {
            const response = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(stock.symbol)}`)
            if (response.ok) {
                const quoteData = await response.json()
                setTradeData({
                    ...tradeData,
                    symbol: stock.symbol,
                    name: stock.name,
                    price: quoteData.price || 0
                })
            } else {
                // Si no se puede obtener el precio, usar datos básicos
                setTradeData({
                    ...tradeData,
                    symbol: stock.symbol,
                    name: stock.name
                })
            }
        } catch (error) {
            console.error("Error fetching quote:", error)
            setTradeData({
                ...tradeData,
                symbol: stock.symbol,
                name: stock.name
            })
        }
    }



    const handleExecuteTrade = async () => {
        try {
            if (tradeType === 'buy') {
                // Calcular costo total incluyendo comisión del broker
                const totalCost = tradeData.shares * tradeData.price
                const commission = totalCost * (brokerBuyCommission / 100)
                const totalWithCommission = totalCost + commission
                
                // Obtener usuario actual
                const userRes = await fetch("/api/user/profile")
                const currentUser = await userRes.json()

                // Crear pago de salida (costo de compra + comisión)
                if (tradeData.journalId) {
                    await fetch("/api/payments", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "Salida",
                            journalId: tradeData.journalId,
                            amount: totalWithCommission,
                            reference: `Compra de ${tradeData.shares} acciones de ${tradeData.symbol} (incluyendo comisión de $${commission.toFixed(2)})`,
                            date: new Date().toISOString(),
                            userId: currentUser.id
                        })
                    })
                }

                // Crear inversión
                await fetch("/api/investments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        symbol: tradeData.symbol,
                        name: tradeData.name,
                        shares: tradeData.shares,
                        buyPrice: tradeData.price,
                        currentPrice: tradeData.price,
                        journalId: tradeData.journalId,
                        buyDate: new Date().toISOString(),
                        status: "activa"
                    })
                })
            } else {
                // Vender inversión o venta en corto
                const sellValue = tradeData.shares * tradeData.price
                const commission = sellValue * (brokerSellCommission / 100)
                const netSellValue = sellValue - commission
                const investment = currentInvestment as Investment
                
                // Obtener usuario actual
                const userRes = await fetch("/api/user/profile")
                const currentUser = await userRes.json()

                // Si no hay inversión previa, es una venta en corto
                if (!investment.id) {
                    // Crear pago de entrada (ingreso por venta - comisión)
                    if (tradeData.journalId) {
                        await fetch("/api/payments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                type: "Entrada",
                                journalId: tradeData.journalId,
                                amount: netSellValue,
                                reference: `Venta en corto de ${tradeData.shares} acciones de ${tradeData.symbol} a $${tradeData.price.toFixed(2)} (descontando comisión de $${commission.toFixed(2)})`,
                                date: new Date().toISOString(),
                                userId: currentUser.id
                            })
                        })
                    }

                    // Crear inversión con precio de venta negativo para indicar posición corta
                    await fetch("/api/investments", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            symbol: tradeData.symbol,
                            name: tradeData.name,
                            shares: -tradeData.shares, // Negativo indica venta en corto
                            buyPrice: tradeData.price,
                            currentPrice: tradeData.price,
                            journalId: tradeData.journalId,
                            buyDate: new Date().toISOString(),
                            status: "activa"
                        })
                    })
                } else {
                    // Venta de inversión existente
                    // Crear pago de entrada (ingreso por venta - comisión)
                    if (tradeData.journalId) {
                        await fetch("/api/payments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                type: "Entrada",
                                journalId: tradeData.journalId,
                                amount: netSellValue,
                                reference: `Venta de ${tradeData.shares} acciones de ${tradeData.symbol} (descontando comisión de $${commission.toFixed(2)})`,
                                date: new Date().toISOString(),
                                userId: currentUser.id
                            })
                        })
                    }

                    // Si se venden todas las acciones, marcar como vendida
                    if (tradeData.shares >= Number(investment.shares)) {
                        await fetch(`/api/investments/${investment.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "vendida" })
                        })
                    } else {
                        // Si se venden parcialmente, reducir la cantidad
                        const remainingShares = Number(investment.shares) - tradeData.shares
                        await fetch(`/api/investments/${investment.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ shares: remainingShares })
                        })
                    }
                }
            }

            await fetchData()
            setIsTrading(false)
            setTradeData({ symbol: "", name: "", shares: 0, price: 0, journalId: "" })
        } catch (error) {
            console.error("Error executing trade:", error)
            setConfirmTitle("Error en la Operación")
            setConfirmMessage("Ocurrió un error al ejecutar la operación. Por favor, intenta nuevamente.")
            setConfirmAction(() => async () => setShowConfirmModal(false))
            setShowConfirmModal(true)
        }
    }

    const calculateTotals = () => {
        const activeInvestments = investments.filter(inv => inv.status === "activa")
        const totalInvested = activeInvestments.reduce((sum, inv) => sum + Number(inv.totalInvested), 0)
        const currentValue = activeInvestments.reduce((sum, inv) => sum + Number(inv.currentValue), 0)
        const totalProfitLoss = currentValue - totalInvested
        const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0

        return { totalInvested, currentValue, totalProfitLoss, totalProfitLossPercent }
    }

    const totals = calculateTotals()

    const columns = [
        { 
            key: "symbol", 
            label: "Símbolo",
            render: (item: Investment) => item.symbol
        },
        { 
            key: "name", 
            label: "Empresa",
            render: (item: Investment) => item.name
        },
        { 
            key: "buyPrice", 
            label: "Precio Compra",
            render: (item: Investment) => `$${Number(item.buyPrice).toFixed(2)}`
        },
        { 
            key: "currentPrice", 
            label: "Precio Actual",
            render: (item: Investment) => `$${Number(item.currentPrice).toFixed(2)}`
        },
        { 
            key: "totalInvested", 
            label: "Invertido",
            render: (item: Investment) => `$${Number(item.totalInvested).toFixed(2)}`
        },
        { 
            key: "currentValue", 
            label: "Valor Actual",
            render: (item: Investment) => `$${Number(item.currentValue).toFixed(2)}`
        },
        { 
            key: "profitLoss", 
            label: "Ganancia/Pérdida",
            render: (item: Investment) => {
                const pl = Number(item.profitLoss)
                const plp = Number(item.profitLossPercent)
                return (
                    <div className={`font-semibold ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${pl.toFixed(2)}
                        <span className="text-xs ml-1">({plp >= 0 ? '+' : ''}{plp.toFixed(2)}%)</span>
                    </div>
                )
            }
        },
        { 
            key: "buyDate", 
            label: "Fecha Compra",
            render: (item: Investment) => new Date(item.buyDate).toLocaleDateString()
        },
        {
            key: "status",
            label: "Estado",
            render: (item: Investment) => (
                <span className={`px-2 py-1 rounded text-xs ${
                    item.status === "activa" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                    {item.status}
                </span>
            )
        },
        {
            key: "journal",
            label: "Diario",
            render: (item: Investment) => item.journal?.name || "-"
        }
    ]

    const actions = (item: Investment) => (
        <div className="flex gap-2">
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    toggleInvestmentVisibility(item.id)
                }}
                className="text-gray-600 hover:text-gray-700"
                title={hiddenInvestments.has(item.id) ? "Mostrar" : "Ocultar"}
            >
                {hiddenInvestments.has(item.id) ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            {item.status === "activa" && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        handleSell(item)
                    }}
                    className="text-green-600 hover:text-green-700"
                    title="Vender"
                >
                    <TrendingDown size={16} />
                </button>
            )}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    handleCloseOperation(item)
                }}
                className="text-blue-600 hover:text-blue-700"
                title="Cerrar operación"
            >
                <X size={16} />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(item.id)
                }}
                className="text-red-600 hover:text-red-700"
                title="Eliminar permanentemente"
            >
                <Trash2 size={16} />
            </button>
        </div>
    )

    const handleSearchFavorite = async (value: string) => {
        setFavoriteSearch(value)
        
        if (value.length < 1) {
            setFavoriteSearchResults([])
            return
        }

        setIsSearchingFavorite(true)
        try {
            const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(value)}`)
            if (response.ok) {
                const stocks = await response.json()
                setFavoriteSearchResults(stocks || [])
            }
        } catch (error) {
            console.error("Error searching stocks:", error)
        } finally {
            setIsSearchingFavorite(false)
        }
    }

    const handleAddFavorite = async (stock: Stock) => {
        try {
            const response = await fetch("/api/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    symbol: stock.symbol,
                    name: stock.name
                })
            })

            if (response.ok) {
                await fetchData()
                setShowFavoritesForm(false)
                setFavoriteSearch("")
                setFavoriteSearchResults([])
            } else if (response.status === 409) {
                alert("Esta acción ya está en favoritos")
            }
        } catch (error) {
            console.error("Error adding favorite:", error)
        }
    }

    const handleRemoveFavorite = async (id: string) => {
        try {
            const response = await fetch(`/api/favorites/${id}`, {
                method: "DELETE"
            })

            if (response.ok) {
                await fetchData()
            }
        } catch (error) {
            console.error("Error removing favorite:", error)
        }
    }

    const handleQuickBuy = (favorite: Favorite) => {
        setTradeType('buy')
        setTradeData({
            symbol: favorite.symbol,
            name: favorite.name,
            shares: 0,
            price: 0,
            journalId: ""
        })
        setSearchQuery(favorite.symbol + " - " + favorite.name)
        setCurrentInvestment({})
        setIsTrading(true)
        
        // Obtener precio actual
        fetch(`/api/stocks/quote?symbol=${encodeURIComponent(favorite.symbol)}`)
            .then(res => res.json())
            .then(quoteData => {
                if (quoteData.price) {
                    setTradeData(prev => ({ ...prev, price: quoteData.price }))
                }
            })
            .catch(error => console.error("Error fetching quote:", error))
    }

    const handleQuickSell = (favorite: Favorite) => {
        setTradeType('sell')
        setTradeData({
            symbol: favorite.symbol,
            name: favorite.name,
            shares: 0,
            price: 0,
            journalId: ""
        })
        setSearchQuery(favorite.symbol + " - " + favorite.name)
        setCurrentInvestment({})
        setIsTrading(true)
        
        // Obtener precio actual
        fetch(`/api/stocks/quote?symbol=${encodeURIComponent(favorite.symbol)}`)
            .then(res => res.json())
            .then(quoteData => {
                if (quoteData.price) {
                    setTradeData(prev => ({ ...prev, price: quoteData.price }))
                }
            })
            .catch(error => console.error("Error fetching quote:", error))
    }

    const handleExplorerSearch = async (value: string) => {
        setExplorerSearchQuery(value)
        
        if (value.length < 1) {
            setExplorerSearchResults([])
            return
        }

        setIsExplorerSearching(true)
        try {
            const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(value)}`)
            if (response.ok) {
                const stocks = await response.json()
                setExplorerSearchResults(stocks || [])
            } else {
                setExplorerSearchResults([])
            }
        } catch (error) {
            console.error("Error searching stocks:", error)
            setExplorerSearchResults([])
        } finally {
            setIsExplorerSearching(false)
        }
    }

    const handleSelectExplorerStock = async (stock: Stock) => {
        setSelectedStock(stock)
        setExplorerSearchQuery("")
        setExplorerSearchResults([])
        
        // Obtener cotización actual
        try {
            const response = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(stock.symbol)}`)
            if (response.ok) {
                const quote = await response.json()
                setStockQuote(quote)
            }
        } catch (error) {
            console.error("Error fetching quote:", error)
        }

        // Cargar datos históricos
        loadHistoricalData(stock.symbol, chartPeriod)
    }

    const loadHistoricalData = async (symbol: string, period: string) => {
        setIsLoadingChart(true)
        console.log('🔍 Loading historical data for:', symbol, 'period:', period)
        try {
            const response = await fetch(`/api/stocks/history?symbol=${encodeURIComponent(symbol)}&period=${period}`)
            console.log('📡 Response status:', response.status)
            if (response.ok) {
                const data = await response.json()
                console.log('📊 Historical data received:', data)
                console.log('📊 Number of data points:', data.data?.length || 0)
                console.log('📊 First data point:', data.data?.[0])
                console.log('📊 Last data point:', data.data?.[data.data?.length - 1])
                const chartData = (data.data || []).map((item: any) => ({
                    ...item,
                    openClose: [item.open, item.close]
                }))
                setHistoricalData(chartData)
                console.log('✅ Chart data set, length:', chartData.length)
            } else {
                try {
                    const errorData = await response.json()
                    console.error('❌ Failed to fetch historical data:', response.status, errorData)
                } catch (e) {
                    console.error('❌ Failed to fetch historical data:', response.status)
                }
                setHistoricalData([])
            }
        } catch (error) {
            console.error("❌ Error fetching historical data:", error)
            setHistoricalData([])
        } finally {
            setIsLoadingChart(false)
        }
    }

    const handlePeriodChange = (period: string) => {
        setChartPeriod(period)
        if (selectedStock) {
            loadHistoricalData(selectedStock.symbol, period)
        }
    }

    return (
        <div className="p-8">
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="text-blue-600" />
                            Simulador de Inversiones en Acciones
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Simula y gestiona tus inversiones en el mercado de valores
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleBuy}
                            className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2"
                        >
                            <ShoppingCart size={18} />
                            Comprar Acciones
                        </button>
                        <button
                            onClick={() => handleSell()}
                            className="bg-white text-gray-900 px-4 py-2 rounded-md border-2 border-gray-900 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <TrendingDown size={18} />
                            Vender Acciones
                        </button>
                    </div>
                </div>
            </div>

            {/* Explorador de Acciones */}
            <div className="mb-6 relative z-50">
                <div className="bg-white rounded-lg border border-gray-200">
                    <button
                        onClick={() => setShowStockExplorer(!showStockExplorer)}
                        className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
                    >
                        <div className="flex items-center gap-2">
                            <Search className="text-blue-600" size={20} />
                            <h2 className="text-lg font-semibold text-gray-900">Explorador de Acciones</h2>
                        </div>
                        <div className="text-gray-500">
                            {showStockExplorer ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                    </button>

                    {showStockExplorer && (
                        <div className="p-4 relative">
                            {/* Buscador */}
                            <div className="mb-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={explorerSearchQuery}
                                        onChange={(e) => handleExplorerSearch(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Buscar acción por símbolo o nombre..."
                                    />
                                    <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                                    
                                    {explorerSearchQuery && explorerSearchResults.length > 0 && (
                                        <div className="absolute z-[100] w-full mt-2 bg-white border-2 border-blue-500 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
                                            {isExplorerSearching ? (
                                                <div className="p-4 text-center text-gray-500">
                                                    <div className="animate-pulse">Buscando...</div>
                                                </div>
                                            ) : (
                                                explorerSearchResults.map((stock, index) => (
                                                    <button
                                                        key={`explorer-${stock.symbol}-${index}`}
                                                        onClick={() => handleSelectExplorerStock(stock)}
                                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-200 last:border-b-0 transition-colors"
                                                    >
                                                        <div className="font-bold text-gray-900 text-base">{stock.symbol}</div>
                                                        <div className="text-sm text-gray-600 mt-0.5">{stock.name}</div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Información de la acción seleccionada */}
                            {selectedStock && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900">{selectedStock.symbol}</h3>
                                            <p className="text-gray-600">{selectedStock.name}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedStock(null)
                                                setStockQuote(null)
                                                setHistoricalData([])
                                            }}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {stockQuote && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                                <p className="text-xs text-gray-500 uppercase mb-1">Precio Actual</p>
                                                <p className="text-2xl font-bold text-gray-900">${stockQuote.price?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                                <p className="text-xs text-gray-500 uppercase mb-1">Cambio</p>
                                                <p className={`text-2xl font-bold ${
                                                    (stockQuote.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {(stockQuote.change || 0) >= 0 ? '+' : ''}{stockQuote.change?.toFixed(2) || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                                <p className="text-xs text-gray-500 uppercase mb-1">% Cambio</p>
                                                <p className={`text-2xl font-bold ${
                                                    (stockQuote.changePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {(stockQuote.changePercent || 0) >= 0 ? '+' : ''}{stockQuote.changePercent?.toFixed(2) || 'N/A'}%
                                                </p>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                                <p className="text-xs text-gray-500 uppercase mb-1">Volumen</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {stockQuote.volume ? stockQuote.volume.toLocaleString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Gráfico de la acción */}
                                    <div className="mt-4">
                                        {/* Controles del gráfico */}
                                        <div className="flex justify-between items-center mb-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setChartType("line")}
                                                        className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 transition-colors ${
                                                            chartType === "line" 
                                                                ? "bg-gray-900 text-white" 
                                                                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        <TrendingUpIcon size={16} />
                                                        Líneas
                                                    </button>
                                                    <button
                                                        onClick={() => setChartType("candlestick")}
                                                        className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 transition-colors ${
                                                            chartType === "candlestick" 
                                                                ? "bg-gray-900 text-white" 
                                                                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        <BarChart3 size={16} />
                                                        Velas
                                                    </button>
                                                </div>
                                                <div className="flex gap-1">
                                                    {["1d", "5d", "1mo", "3mo", "6mo", "1y"].map((period) => (
                                                        <button
                                                            key={period}
                                                            onClick={() => handlePeriodChange(period)}
                                                            className={`px-2 py-1 rounded text-xs transition-colors ${
                                                                chartPeriod === period
                                                                    ? "bg-gray-900 text-white"
                                                                    : "bg-white text-gray-700 hover:bg-gray-100"
                                                            }`}
                                                        >
                                                            {period.toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Contenedor del gráfico */}
                                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                {isLoadingChart ? (
                                                    <div className="h-80 flex items-center justify-center">
                                                        <div className="text-gray-500">Cargando gráfico...</div>
                                                    </div>
                                                ) : historicalData.length === 0 ? (
                                                    <div className="h-80 flex flex-col items-center justify-center gap-2">
                                                        <div className="text-gray-500 text-lg">No hay datos disponibles</div>
                                                        <div className="text-gray-400 text-sm">Intenta con otro período o acción</div>
                                                    </div>
                                                ) : chartType === "line" ? (
                                                    <ResponsiveContainer width="100%" height={320}>
                                                        <AreaChart data={historicalData}>
                                                            <defs>
                                                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                            <XAxis 
                                                                dataKey="date" 
                                                                tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { 
                                                                    month: 'short', 
                                                                    day: 'numeric' 
                                                                })}
                                                                stroke="#6b7280"
                                                                style={{ fontSize: '12px' }}
                                                            />
                                                            <YAxis 
                                                                domain={['auto', 'auto']}
                                                                tickFormatter={(value) => `$${value.toFixed(2)}`}
                                                                stroke="#6b7280"
                                                                style={{ fontSize: '12px' }}
                                                            />
                                                            <Tooltip 
                                                                content={({ active, payload }) => {
                                                                    if (active && payload && payload.length) {
                                                                        const data = payload[0].payload
                                                                        return (
                                                                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                                                                <p className="text-xs text-gray-500 mb-1">
                                                                                    {new Date(data.date).toLocaleDateString('es-ES', { 
                                                                                        year: 'numeric',
                                                                                        month: 'long', 
                                                                                        day: 'numeric' 
                                                                                    })}
                                                                                </p>
                                                                                <p className="text-sm font-bold text-gray-900">
                                                                                    Precio: ${data.close.toFixed(2)}
                                                                                </p>
                                                                                <p className="text-xs text-gray-600">
                                                                                    Volumen: {data.volume.toLocaleString()}
                                                                                </p>
                                                                            </div>
                                                                        )
                                                                    }
                                                                    return null
                                                                }}
                                                            />
                                                            <Area 
                                                                type="monotone" 
                                                                dataKey="close" 
                                                                stroke="#3b82f6" 
                                                                strokeWidth={2}
                                                                fill="url(#colorPrice)"
                                                                dot={false}
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <ResponsiveContainer width="100%" height={320}>
                                                        <ComposedChart data={historicalData}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                            <XAxis 
                                                                dataKey="date" 
                                                                tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { 
                                                                    month: 'short', 
                                                                    day: 'numeric' 
                                                                })}
                                                                stroke="#6b7280"
                                                                style={{ fontSize: '12px' }}
                                                            />
                                                            <YAxis 
                                                                domain={['auto', 'auto']}
                                                                tickFormatter={(value) => `$${value.toFixed(2)}`}
                                                                stroke="#6b7280"
                                                                style={{ fontSize: '12px' }}
                                                            />
                                                            <Tooltip 
                                                                content={({ active, payload }) => {
                                                                    if (active && payload && payload.length) {
                                                                        const data = payload[0].payload
                                                                        const change = data.close - data.open
                                                                        const changePercent = ((change / data.open) * 100)
                                                                        const isPositive = change >= 0
                                                                        return (
                                                                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                                                                <p className="text-xs text-gray-500 mb-2">
                                                                                    {new Date(data.date).toLocaleDateString('es-ES', { 
                                                                                        year: 'numeric',
                                                                                        month: 'long', 
                                                                                        day: 'numeric' 
                                                                                    })}
                                                                                </p>
                                                                                <div className="space-y-1">
                                                                                    <div className="flex justify-between gap-3">
                                                                                        <span className="text-xs text-gray-600">Apertura:</span>
                                                                                        <span className="text-xs font-semibold">${data.open.toFixed(2)}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between gap-3">
                                                                                        <span className="text-xs text-gray-600">Máximo:</span>
                                                                                        <span className="text-xs font-semibold text-green-600">${data.high.toFixed(2)}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between gap-3">
                                                                                        <span className="text-xs text-gray-600">Mínimo:</span>
                                                                                        <span className="text-xs font-semibold text-red-600">${data.low.toFixed(2)}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between gap-3">
                                                                                        <span className="text-xs text-gray-600">Cierre:</span>
                                                                                        <span className="text-xs font-bold text-gray-900">${data.close.toFixed(2)}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between gap-3 pt-1 border-t border-gray-200">
                                                                                        <span className="text-xs text-gray-600">Cambio:</span>
                                                                                        <span className={`text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                                                            {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex justify-between gap-3">
                                                                                        <span className="text-xs text-gray-600">Volumen:</span>
                                                                                        <span className="text-xs font-semibold">{data.volume.toLocaleString()}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    }
                                                                    return null
                                                                }}
                                                            />
                                                            <Bar
                                                                dataKey="openClose"
                                                                shape={(props: any) => {
                                                                    const { x, y, width, height, payload } = props
                                                                    const isGrowing = payload.close >= payload.open
                                                                    const color = isGrowing ? "#10b981" : "#ef4444"
                                                                    const yHigh = y - ((payload.high - payload.close) / (payload.high - payload.low)) * height
                                                                    const yLow = y + ((payload.open - payload.low) / (payload.high - payload.low)) * height
                                                                    const yOpen = y + ((payload.close - payload.open) / (payload.high - payload.low)) * height
                                                                    const bodyHeight = Math.abs(yOpen - y)
                                                                    
                                                                    return (
                                                                        <g>
                                                                            {/* Mecha superior */}
                                                                            <line
                                                                                x1={x + width / 2}
                                                                                y1={yHigh}
                                                                                x2={x + width / 2}
                                                                                y2={isGrowing ? y : yOpen}
                                                                                stroke={color}
                                                                                strokeWidth={1}
                                                                            />
                                                                            {/* Cuerpo de la vela */}
                                                                            <rect
                                                                                x={x + width * 0.25}
                                                                                y={isGrowing ? y : yOpen}
                                                                                width={width * 0.5}
                                                                                height={bodyHeight || 1}
                                                                                fill={color}
                                                                                stroke={color}
                                                                                strokeWidth={1}
                                                                            />
                                                                            {/* Mecha inferior */}
                                                                            <line
                                                                                x1={x + width / 2}
                                                                                y1={isGrowing ? yOpen : y}
                                                                                x2={x + width / 2}
                                                                                y2={yLow}
                                                                                stroke={color}
                                                                                strokeWidth={1}
                                                                            />
                                                                        </g>
                                                                    )
                                                                }}
                                                            />
                                                        </ComposedChart>
                                                    </ResponsiveContainer>
                                                )}
                                            </div>
                                        </div>

                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => {
                                                handleBuy()
                                                setTradeData(prev => ({
                                                    ...prev,
                                                    symbol: selectedStock.symbol,
                                                    name: selectedStock.name,
                                                    price: stockQuote?.price || 0
                                                }))
                                                setSearchQuery(selectedStock.symbol + " - " + selectedStock.name)
                                            }}
                                            className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 flex items-center justify-center gap-2"
                                        >
                                            <ShoppingCart size={18} />
                                            Comprar {selectedStock.symbol}
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleSell()
                                                setTradeData(prev => ({
                                                    ...prev,
                                                    symbol: selectedStock.symbol,
                                                    name: selectedStock.name,
                                                    price: stockQuote?.price || 0
                                                }))
                                                setSearchQuery(selectedStock.symbol + " - " + selectedStock.name)
                                            }}
                                            className="flex-1 bg-white text-gray-900 px-4 py-2 rounded-md border-2 border-gray-900 hover:bg-gray-50 flex items-center justify-center gap-2"
                                        >
                                            <TrendingDown size={18} />
                                            Vender {selectedStock.symbol}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Resumen de Inversiones */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-300 uppercase font-semibold">Capital Disponible</p>
                            <p className="text-2xl font-bold text-white">${availableCapital.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {availableCapital > 0 ? 'Listo para invertir' : 'Agrega capital en Pagos'}
                            </p>
                        </div>
                        <div className="bg-white/10 p-3 rounded-lg">
                            <DollarSign className="text-white" size={28} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Total Invertido</p>
                            <p className="text-2xl font-bold text-gray-900">${totals.totalInvested.toFixed(2)}</p>
                        </div>
                        <TrendingUp className="text-blue-500" size={32} />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Valor Actual</p>
                            <p className="text-2xl font-bold text-gray-900">${totals.currentValue.toFixed(2)}</p>
                        </div>
                        <TrendingUp className="text-green-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Ganancia/Pérdida</p>
                            <p className={`text-2xl font-bold ${totals.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${totals.totalProfitLoss.toFixed(2)}
                            </p>
                        </div>
                        <div className={`text-3xl ${totals.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {totals.totalProfitLoss >= 0 ? '↑' : '↓'}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Rendimiento</p>
                            <p className={`text-2xl font-bold ${totals.totalProfitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {totals.totalProfitLossPercent >= 0 ? '+' : ''}{totals.totalProfitLossPercent.toFixed(2)}%
                            </p>
                        </div>
                        <div className="text-2xl">📊</div>
                    </div>
                </div>
            </div>

            {/* Formulario de Compra/Venta */}
            {isTrading && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {tradeType === 'buy' ? (
                                <>
                                    <ShoppingCart className="text-green-600" />
                                    Comprar Acciones
                                </>
                            ) : (
                                <>
                                    <TrendingDown className="text-red-600" />
                                    Vender Acciones
                                </>
                            )}
                        </h2>
                        <button
                            onClick={() => setIsTrading(false)}
                            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Buscador de Acciones */}
                    {(tradeType === 'buy' || (tradeType === 'sell' && !currentInvestment.id)) && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Buscar Acción
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                    placeholder="Buscar por símbolo o nombre (ej: AAPL, Apple, Tesla...)"
                                />
                                <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                                
                                {/* Resultados de búsqueda */}
                                {showSuggestions && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-gray-500">
                                                Buscando...
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map((stock, index) => (
                                                <button
                                                    key={`${stock.symbol}-${index}`}
                                                    onClick={() => handleSelectStock(stock)}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                                >
                                                    <div className="font-semibold text-gray-900">{stock.symbol}</div>
                                                    <div className="text-sm text-gray-600">{stock.name}</div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500">
                                                No se encontraron resultados
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Símbolo *
                            </label>
                            <input
                                type="text"
                                value={tradeData.symbol}
                                onChange={(e) => setTradeData({ ...tradeData, symbol: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
                                placeholder="Selecciona una acción arriba"
                                disabled={tradeType === 'sell'}
                                readOnly
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre de la Empresa *
                            </label>
                            <input
                                type="text"
                                value={tradeData.name}
                                onChange={(e) => setTradeData({ ...tradeData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50"
                                placeholder="Selecciona una acción arriba"
                                disabled={tradeType === 'sell'}
                                readOnly
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad de Acciones *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={tradeData.shares}
                                onChange={(e) => setTradeData({ ...tradeData, shares: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                max={tradeType === 'sell' ? Number((currentInvestment as Investment)?.shares || 0) : undefined}
                            />
                            {tradeType === 'sell' && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Máximo: {Number((currentInvestment as Investment)?.shares || 0).toFixed(2)} acciones
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio por Acción *
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={tradeData.price}
                                    onChange={(e) => setTradeData({ ...tradeData, price: Number(e.target.value) })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                />
                                {tradeData.symbol && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                const response = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(tradeData.symbol)}`)
                                                if (response.ok) {
                                                    const quoteData = await response.json()
                                                    if (quoteData.price) {
                                                        setTradeData({ ...tradeData, price: quoteData.price })
                                                    }
                                                }
                                            } catch (error) {
                                                console.error("Error fetching price:", error)
                                            }
                                        }}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                                        title="Actualizar precio en tiempo real"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                )}
                            </div>
                            {tradeData.symbol && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Haz clic en el botón para obtener el precio actual
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Diario Contable *
                            </label>
                            <select
                                value={tradeData.journalId}
                                onChange={(e) => setTradeData({ ...tradeData, journalId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                            >
                                <option value="">Seleccione un diario</option>
                                {journals.map((journal) => (
                                    <option key={journal.id} value={journal.id}>
                                        {journal.name} ({journal.code})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {tradeType === 'buy' 
                                    ? 'Se creará un pago de salida por la compra' 
                                    : 'Se creará un pago de entrada por la venta'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Resumen de Operación */}
                    {tradeData.shares > 0 && tradeData.price > 0 && (() => {
                        const subtotal = tradeData.shares * tradeData.price
                        const commission = tradeType === 'buy' 
                            ? subtotal * (brokerBuyCommission / 100)
                            : subtotal * (brokerSellCommission / 100)
                        const total = tradeType === 'buy' 
                            ? subtotal + commission
                            : subtotal - commission

                        return (
                            <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
                                <h3 className="font-semibold mb-3 text-gray-900">Resumen de la Operación:</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-900">Subtotal:</span>
                                        <span className="font-medium text-gray-900">
                                            ${subtotal.toFixed(2)}
                                        </span>
                                    </div>
                                    
                                    {(tradeType === 'buy' ? brokerBuyCommission : brokerSellCommission) > 0 && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-900">
                                                    Comisión ({tradeType === 'buy' ? brokerBuyCommission : brokerSellCommission}%):
                                                </span>
                                                <span className="font-medium text-gray-900">
                                                    {tradeType === 'buy' ? '+' : '-'}${commission.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="border-t border-gray-300 pt-2"></div>
                                        </>
                                    )}
                                    
                                    <div className="flex justify-between">
                                        <span className="text-gray-900 font-semibold">Total:</span>
                                        <span className={`font-bold text-lg ${
                                            tradeType === 'buy' ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                            {tradeType === 'buy' ? '-' : '+'}${total.toFixed(2)}
                                        </span>
                                    </div>
                                    
                                    {tradeType === 'sell' && currentInvestment && (() => {
                                        const buyPrice = Number((currentInvestment as Investment).buyPrice)
                                        const profit = (tradeData.price - buyPrice) * tradeData.shares
                                        const netProfit = profit - commission
                                        
                                        return (
                                            <>
                                                <div className="border-t border-gray-300 pt-2 mt-2"></div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-900">Precio Compra:</span>
                                                    <span className="text-gray-900">${buyPrice.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-900">Ganancia/Pérdida Bruta:</span>
                                                    <span className={`font-medium ${
                                                        profit >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        ${profit.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-900 font-semibold">Ganancia/Pérdida Neta:</span>
                                                    <span className={`font-bold ${
                                                        netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        ${netProfit.toFixed(2)}
                                                    </span>
                                                </div>
                                            </>
                                        )
                                    })()}
                                </div>
                            </div>
                        )
                    })()}

                    <div className="flex gap-2">
                        <button
                            onClick={handleExecuteTrade}
                            disabled={!tradeData.shares || !tradeData.price || !tradeData.journalId || !tradeData.symbol || !tradeData.name}
                            className="px-6 py-2 rounded-md bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {tradeType === 'buy' ? <ShoppingCart size={18} /> : <TrendingDown size={18} />}
                            {tradeType === 'buy' ? 'Ejecutar Compra' : 'Ejecutar Venta'}
                        </button>
                        <button
                            onClick={() => setIsTrading(false)}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    {hiddenInvestments.size > 0 && (
                        <span>{hiddenInvestments.size} {hiddenInvestments.size === 1 ? 'fila oculta' : 'filas ocultas'}</span>
                    )}
                </div>
                {hiddenInvestments.size > 0 && (
                    <button
                        onClick={() => setShowHidden(!showHidden)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
                    >
                        {showHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showHidden ? 'Ocultar filas ocultas' : 'Mostrar todas las filas'}
                    </button>
                )}
            </div>

            <TableTemplate
                data={showHidden ? investments : investments.filter(inv => !hiddenInvestments.has(inv.id))}
                columns={columns}
                title="Inversiones en Acciones"
                getItemId={(item) => item.id}
                onRowClick={(item) => handleCloseOperation(item)}
            />

            {/* Sección de Acciones Favoritas */}
            <div className="mt-8">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Acciones Favoritas
                        </h2>
                        <button
                            onClick={() => setShowFavoritesForm(!showFavoritesForm)}
                            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 flex items-center gap-2 text-sm"
                        >
                            {showFavoritesForm ? <X size={16} /> : <Plus size={16} />}
                            {showFavoritesForm ? 'Cancelar' : 'Agregar Favorito'}
                        </button>
                    </div>

                    {/* Formulario para agregar favorito */}
                    {showFavoritesForm && (
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buscar Acción para Agregar
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={favoriteSearch}
                                    onChange={(e) => handleSearchFavorite(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                    placeholder="Buscar por símbolo o nombre..."
                                />
                                <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                                
                                {favoriteSearch && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                        {isSearchingFavorite ? (
                                            <div className="p-4 text-center text-gray-500">Buscando...</div>
                                        ) : favoriteSearchResults.length > 0 ? (
                                            favoriteSearchResults.map((stock, index) => (
                                                <button
                                                    key={`fav-${stock.symbol}-${index}`}
                                                    onClick={() => handleAddFavorite(stock)}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                                >
                                                    <div className="font-semibold text-gray-900">{stock.symbol}</div>
                                                    <div className="text-sm text-gray-600">{stock.name}</div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500">No se encontraron resultados</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Lista de favoritos */}
                    <div className="p-4">
                        {favorites.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                <p>No tienes acciones favoritas</p>
                                <p className="text-sm mt-1">Agrega acciones para seguir sus precios</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {favorites.map((favorite) => (
                                    <div key={favorite.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{favorite.symbol}</h3>
                                                <p className="text-sm text-gray-600">{favorite.name}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveFavorite(favorite.id)}
                                                className="text-gray-400 hover:text-red-600"
                                                title="Quitar de favoritos"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => handleQuickBuy(favorite)}
                                                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 flex items-center justify-center gap-2 text-sm"
                                            >
                                                <ShoppingCart size={16} />
                                                Comprar
                                            </button>
                                            <button
                                                onClick={() => handleQuickSell(favorite)}
                                                className="flex-1 px-4 py-2 bg-white text-gray-900 border-2 border-gray-900 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 text-sm"
                                            >
                                                <TrendingDown size={16} />
                                                Vender
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Confirmación */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{confirmTitle}</h3>
                        <p className="text-gray-700 mb-6">{confirmMessage}</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirmAction) {
                                        await confirmAction()
                                    } else {
                                        setShowConfirmModal(false)
                                    }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
