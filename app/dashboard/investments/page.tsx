"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Pencil, Trash2, Save, X, RefreshCw, DollarSign, ShoppingCart, TrendingDown, Search } from "lucide-react"
import TableTemplate from "@/components/TableTemplate"

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
    const [isEditing, setIsEditing] = useState(false)
    const [isTrading, setIsTrading] = useState(false)
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
    const [searchQuery, setSearchQuery] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [tradeData, setTradeData] = useState({
        symbol: "",
        name: "",
        shares: 0,
        price: 0,
        journalId: ""
    })
    const [currentInvestment, setCurrentInvestment] = useState<Partial<Investment>>({
        symbol: "",
        name: "",
        shares: 0,
        buyPrice: 0,
        currentPrice: 0,
        journalId: "",
        buyDate: new Date().toISOString().split('T')[0],
        status: "activa"
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [investmentRes, journalRes] = await Promise.all([
                fetch("/api/investments"),
                fetch("/api/journals")
            ])

            if (investmentRes.ok && journalRes.ok) {
                const investmentsData = await investmentRes.json()
                const journalsData = await journalRes.json()
                setInvestments(investmentsData)
                setJournals(journalsData)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar esta inversión?")) return

        try {
            const res = await fetch(`/api/investments/${id}`, {
                method: "DELETE",
            })
            if (res.ok) {
                setInvestments(investments.filter((inv) => inv.id !== id))
            }
        } catch (error) {
            console.error("Error deleting investment:", error)
        }
    }

    const handleEdit = (investment: Investment) => {
        setCurrentInvestment({
            ...investment,
            buyDate: new Date(investment.buyDate).toISOString().split('T')[0]
        })
        setIsEditing(true)
    }

    const handleCreate = () => {
        setCurrentInvestment({
            symbol: "",
            name: "",
            shares: 0,
            buyPrice: 0,
            currentPrice: 0,
            journalId: "",
            buyDate: new Date().toISOString().split('T')[0],
            status: "activa"
        })
        setIsEditing(true)
    }

    const handleSave = async () => {
        try {
            const method = currentInvestment.id ? "PATCH" : "POST"
            const url = currentInvestment.id
                ? `/api/investments/${currentInvestment.id}`
                : "/api/investments"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentInvestment),
            })

            if (res.ok) {
                await fetchData()
                setIsEditing(false)
                setCurrentInvestment({
                    symbol: "",
                    name: "",
                    shares: 0,
                    buyPrice: 0,
                    currentPrice: 0,
                    journalId: "",
                    buyDate: new Date().toISOString().split('T')[0],
                    status: "activa"
                })
            }
        } catch (error) {
            console.error("Error saving investment:", error)
        }
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
        setIsTrading(true)
    }

    const handleSell = (investment: Investment) => {
        setTradeType('sell')
        setTradeData({
            symbol: investment.symbol,
            name: investment.name,
            shares: Number(investment.shares),
            price: Number(investment.currentPrice),
            journalId: investment.journalId || ""
        })
        setSearchQuery("")
        setShowSuggestions(false)
        setCurrentInvestment(investment)
        setIsTrading(true)
    }

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setShowSuggestions(value.length > 0)
    }

    const handleSelectStock = (stock: Stock) => {
        setTradeData({
            ...tradeData,
            symbol: stock.symbol,
            name: stock.name
        })
        setSearchQuery(stock.symbol + " - " + stock.name)
        setShowSuggestions(false)
    }

    const filteredStocks = POPULAR_STOCKS.filter(stock => 
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleExecuteTrade = async () => {
        try {
            if (tradeType === 'buy') {
                // Crear nueva inversión
                const totalCost = tradeData.shares * tradeData.price
                
                // Crear pago de salida (costo de compra)
                if (tradeData.journalId) {
                    await fetch("/api/payments", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "Salida",
                            journalId: tradeData.journalId,
                            amount: totalCost,
                            reference: `Compra de ${tradeData.shares} acciones de ${tradeData.symbol}`,
                            date: new Date().toISOString()
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
                // Vender inversión
                const sellValue = tradeData.shares * tradeData.price
                const investment = currentInvestment as Investment
                
                // Crear pago de entrada (ingreso por venta)
                if (tradeData.journalId) {
                    await fetch("/api/payments", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "Entrada",
                            journalId: tradeData.journalId,
                            amount: sellValue,
                            reference: `Venta de ${tradeData.shares} acciones de ${tradeData.symbol}`,
                            date: new Date().toISOString()
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

            await fetchData()
            setIsTrading(false)
            setTradeData({ symbol: "", name: "", shares: 0, price: 0, journalId: "" })
        } catch (error) {
            console.error("Error executing trade:", error)
            alert("Error al ejecutar la operación")
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
        { key: "symbol", label: "Símbolo" },
        { key: "name", label: "Empresa" },
        { 
            key: "shares", 
            label: "Acciones",
            render: (item: Investment) => Number(item.shares).toFixed(2)
        },
        { 
            key: "buyPrice", 
            label: "Precio Compra",
            render: (item: Investment) => `$${Number(item.buyPrice).toFixed(2)}`
        },
        { 
            key: "currentPrice", 
            label: "Precio Actual",
            render: (item: Investment) => (
                <div className="flex items-center gap-2">
                    <span>${Number(item.currentPrice).toFixed(2)}</span>
                    <button
                        onClick={() => {
                            const newPrice = prompt("Nuevo precio:", item.currentPrice.toString())
                            if (newPrice && !isNaN(Number(newPrice))) {
                                handleUpdatePrice(item.id, Number(newPrice))
                            }
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Actualizar precio"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            )
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
            {item.status === "activa" && (
                <button
                    onClick={() => handleSell(item)}
                    className="text-green-600 hover:text-green-700"
                    title="Vender"
                >
                    <TrendingDown size={16} />
                </button>
            )}
            <button
                onClick={() => handleEdit(item)}
                className="text-blue-600 hover:text-blue-700"
                title="Editar"
            >
                <Pencil size={16} />
            </button>
            <button
                onClick={() => handleDelete(item.id)}
                className="text-red-600 hover:text-red-700"
                title="Eliminar"
            >
                <Trash2 size={16} />
            </button>
        </div>
    )

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
                    <button
                        onClick={handleBuy}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                        <ShoppingCart size={18} />
                        Comprar Acciones
                    </button>
                </div>
            </div>

            {/* Resumen de Inversiones */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Total Invertido</p>
                            <p className="text-2xl font-bold text-gray-900">${totals.totalInvested.toFixed(2)}</p>
                        </div>
                        <DollarSign className="text-blue-500" size={32} />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Símbolo *
                            </label>
                            <input
                                type="text"
                                value={tradeData.symbol}
                                onChange={(e) => setTradeData({ ...tradeData, symbol: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                placeholder="NKE, AAPL, TSLA..."
                                disabled={tradeType === 'sell'}
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                placeholder="Nike Inc., Apple Inc..."
                                disabled={tradeType === 'sell'}
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
                            <input
                                type="number"
                                step="0.01"
                                value={tradeData.price}
                                onChange={(e) => setTradeData({ ...tradeData, price: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                            />
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
                    {tradeData.shares > 0 && tradeData.price > 0 && (
                        <div className="bg-gray-50 p-4 rounded-md mb-4">
                            <h3 className="font-semibold mb-2">Resumen de la Operación:</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total:</span>
                                    <span className={`font-semibold text-lg ${
                                        tradeType === 'buy' ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                        {tradeType === 'buy' ? '-' : '+'}${(tradeData.shares * tradeData.price).toFixed(2)}
                                    </span>
                                </div>
                                {tradeType === 'sell' && currentInvestment && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Precio Compra:</span>
                                            <span>${Number((currentInvestment as Investment).buyPrice).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Ganancia/Pérdida:</span>
                                            <span className={`font-semibold ${
                                                (tradeData.price - Number((currentInvestment as Investment).buyPrice)) * tradeData.shares >= 0
                                                    ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                ${((tradeData.price - Number((currentInvestment as Investment).buyPrice)) * tradeData.shares).toFixed(2)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={handleExecuteTrade}
                            disabled={!tradeData.shares || !tradeData.price || !tradeData.journalId || !tradeData.symbol || !tradeData.name}
                            className={`px-6 py-2 rounded-md text-white flex items-center justify-center gap-2 ${
                                tradeType === 'buy' 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : 'bg-red-600 hover:bg-red-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
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

            <TableTemplate
                data={investments}
                columns={columns}
                loading={loading}
                onAdd={handleCreate}
                actions={actions}
                emptyMessage="No hay inversiones registradas"
            />

            {/* Modal de Edición/Creación */}
            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                {currentInvestment.id ? "Editar Inversión" : "Nueva Inversión"}
                            </h2>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Símbolo *
                                    </label>
                                    <input
                                        type="text"
                                        value={currentInvestment.symbol || ""}
                                        onChange={(e) =>
                                            setCurrentInvestment({ ...currentInvestment, symbol: e.target.value.toUpperCase() })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="NKE, AAPL, TSLA..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre de la Empresa *
                                    </label>
                                    <input
                                        type="text"
                                        value={currentInvestment.name || ""}
                                        onChange={(e) =>
                                            setCurrentInvestment({ ...currentInvestment, name: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="Nike Inc., Apple Inc..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cantidad de Acciones *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={currentInvestment.shares || 0}
                                        onChange={(e) =>
                                            setCurrentInvestment({ ...currentInvestment, shares: Number(e.target.value) })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Precio de Compra *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={currentInvestment.buyPrice || 0}
                                        onChange={(e) =>
                                            setCurrentInvestment({ ...currentInvestment, buyPrice: Number(e.target.value) })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Precio Actual
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={currentInvestment.currentPrice || currentInvestment.buyPrice || 0}
                                        onChange={(e) =>
                                            setCurrentInvestment({ ...currentInvestment, currentPrice: Number(e.target.value) })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha de Compra
                                    </label>
                                    <input
                                        type="date"
                                        value={currentInvestment.buyDate || ""}
                                        onChange={(e) =>
                                            setCurrentInvestment({ ...currentInvestment, buyDate: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Diario Contable
                                    </label>
                                    <select
                                        value={currentInvestment.journalId || ""}
                                        onChange={(e) =>
                                            setCurrentInvestment({ ...currentInvestment, journalId: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">Sin diario</option>
                                        {journals.map((journal) => (
                                            <option key={journal.id} value={journal.id}>
                                                {journal.name} ({journal.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estado
                                    </label>
                                    <select
                                        value={currentInvestment.status || "activa"}
                                        onChange={(e) =>
                                            setCurrentInvestment({ ...currentInvestment, status: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="activa">Activa</option>
                                        <option value="vendida">Vendida</option>
                                    </select>
                                </div>
                            </div>

                            {/* Cálculos en tiempo real */}
                            {currentInvestment.shares && currentInvestment.buyPrice && (
                                <div className="bg-gray-50 p-4 rounded-md">
                                    <h3 className="font-semibold mb-2">Resumen de la Inversión:</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-600">Total Invertido:</span>
                                            <span className="ml-2 font-semibold">
                                                ${(Number(currentInvestment.shares) * Number(currentInvestment.buyPrice)).toFixed(2)}
                                            </span>
                                        </div>
                                        {currentInvestment.currentPrice && (
                                            <>
                                                <div>
                                                    <span className="text-gray-600">Valor Actual:</span>
                                                    <span className="ml-2 font-semibold">
                                                        ${(Number(currentInvestment.shares) * Number(currentInvestment.currentPrice)).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Ganancia/Pérdida:</span>
                                                    <span className={`ml-2 font-semibold ${
                                                        (Number(currentInvestment.shares) * (Number(currentInvestment.currentPrice) - Number(currentInvestment.buyPrice))) >= 0 
                                                        ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        ${(Number(currentInvestment.shares) * (Number(currentInvestment.currentPrice) - Number(currentInvestment.buyPrice))).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Rendimiento:</span>
                                                    <span className={`ml-2 font-semibold ${
                                                        ((Number(currentInvestment.currentPrice) - Number(currentInvestment.buyPrice)) / Number(currentInvestment.buyPrice) * 100) >= 0 
                                                        ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {((Number(currentInvestment.currentPrice) - Number(currentInvestment.buyPrice)) / Number(currentInvestment.buyPrice) * 100).toFixed(2)}%
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Guardar
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
