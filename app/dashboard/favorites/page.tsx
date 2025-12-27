"use client"

import { useState, useEffect } from "react"
import { TrendingDown, X, Search, Plus, ShoppingCart, Star, Trash2 } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer } from "recharts"

interface Stock {
    symbol: string
    name: string
    exchange?: string
}

interface Favorite {
    id: string
    symbol: string
    name: string
    note?: string | null
    createdAt: string
}

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Favorite[]>([])
    const [favoriteChartData, setFavoriteChartData] = useState<Record<string, any[]>>({})
    const [favoriteQuotes, setFavoriteQuotes] = useState<Record<string, any>>({})
    const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(new Set())
    const [showAddForm, setShowAddForm] = useState(false)
    const [favoriteSearch, setFavoriteSearch] = useState("")
    const [searchResults, setSearchResults] = useState<Stock[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [note, setNote] = useState("")
    const [selectedFavorite, setSelectedFavorite] = useState<Favorite | null>(null)
    const [loading, setLoading] = useState(true)
    const [journals, setJournals] = useState<any[]>([])
    const [showBuyModal, setShowBuyModal] = useState(false)
    const [tradeData, setTradeData] = useState({
        symbol: "",
        name: "",
        shares: 0,
        price: 0,
        journalId: ""
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [favoritesRes, journalsRes] = await Promise.all([
                fetch("/api/stocks/favorites"),
                fetch("/api/journals")
            ])

            if (favoritesRes.ok) {
                const favoritesData = await favoritesRes.json()
                setFavorites(favoritesData)

                // Cargar datos de cotización y gráficos para cada favorito
                favoritesData.forEach((fav: Favorite) => {
                    loadFavoriteData(fav.symbol)
                })
            }

            if (journalsRes.ok) {
                const journalsData = await journalsRes.json()
                setJournals(journalsData)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadFavoriteData = async (symbol: string) => {
        setLoadingFavorites(prev => new Set(prev).add(symbol))

        try {
            // Cargar cotización actual
            const quoteRes = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(symbol)}`)
            if (quoteRes.ok) {
                const quote = await quoteRes.json()
                setFavoriteQuotes(prev => ({ ...prev, [symbol]: quote }))
            }

            // Cargar datos históricos (últimos 5 días)
            const historyRes = await fetch(`/api/stocks/history?symbol=${encodeURIComponent(symbol)}&period=5d`)
            if (historyRes.ok) {
                const historyData = await historyRes.json()
                const chartData = (historyData.data || []).map((item: any) => ({
                    ...item,
                    openClose: [item.open, item.close]
                }))
                setFavoriteChartData(prev => ({ ...prev, [symbol]: chartData }))
            }
        } catch (error) {
            console.error(`Error loading data for ${symbol}:`, error)
        } finally {
            setLoadingFavorites(prev => {
                const newSet = new Set(prev)
                newSet.delete(symbol)
                return newSet
            })
        }
    }

    const handleSearchFavorite = async (query: string) => {
        setFavoriteSearch(query)

        if (query.length < 2) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        try {
            const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`)
            if (response.ok) {
                const data = await response.json()
                setSearchResults(data.quotes || [])
            }
        } catch (error) {
            console.error("Error searching stocks:", error)
        } finally {
            setIsSearching(false)
        }
    }

    const handleAddFavorite = async (stock: Stock) => {
        try {
            const response = await fetch("/api/stocks/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    symbol: stock.symbol,
                    name: stock.name,
                    note: note
                })
            })

            if (response.ok) {
                await fetchData()
                setFavoriteSearch("")
                setSearchResults([])
                setNote("")
                setShowAddForm(false)
            } else {
                const error = await response.json()
                alert(error.error || "Error al agregar favorito")
            }
        } catch (error) {
            console.error("Error adding favorite:", error)
            alert("Error al agregar favorito")
        }
    }

    const handleRemoveFavorite = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este favorito?")) return

        try {
            const response = await fetch(`/api/stocks/favorites/${id}`, {
                method: "DELETE"
            })

            if (response.ok) {
                await fetchData()
            }
        } catch (error) {
            console.error("Error removing favorite:", error)
        }
    }

    const handleUpdateNote = async (id: string, newNote: string) => {
        try {
            const response = await fetch(`/api/stocks/favorites/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note: newNote })
            })

            if (response.ok) {
                await fetchData()
                setSelectedFavorite(null)
            }
        } catch (error) {
            console.error("Error updating note:", error)
        }
    }

    const handleQuickBuy = async (symbol: string, name: string) => {
        // Obtener precio actual
        try {
            const response = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(symbol)}`)
            if (response.ok) {
                const quoteData = await response.json()
                setTradeData({
                    symbol,
                    name,
                    shares: 0,
                    price: quoteData.price || 0,
                    journalId: journals.length > 0 ? journals[0].id : ""
                })
            } else {
                setTradeData({
                    symbol,
                    name,
                    shares: 0,
                    price: 0,
                    journalId: journals.length > 0 ? journals[0].id : ""
                })
            }
        } catch (error) {
            console.error("Error fetching quote:", error)
            setTradeData({
                symbol,
                name,
                shares: 0,
                price: 0,
                journalId: journals.length > 0 ? journals[0].id : ""
            })
        }
        setShowBuyModal(true)
    }

    const handleExecuteBuy = async () => {
        try {
            if (!tradeData.journalId) {
                alert("Por favor selecciona un diario")
                return
            }

            if (tradeData.shares <= 0) {
                alert("Por favor ingresa una cantidad válida de acciones")
                return
            }

            if (tradeData.price <= 0) {
                alert("Por favor ingresa un precio válido")
                return
            }

            // Obtener usuario actual
            const userRes = await fetch("/api/user/profile")
            const currentUser = await userRes.json()

            // Calcular costo total
            const totalCost = tradeData.shares * tradeData.price

            // Crear pago de salida
            await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "Salida",
                    journalId: tradeData.journalId,
                    amount: totalCost,
                    reference: `Compra de ${tradeData.shares} acciones de ${tradeData.symbol}`,
                    date: new Date().toISOString(),
                    userId: currentUser.id
                })
            })

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

            // Cerrar modal y limpiar datos
            setShowBuyModal(false)
            setTradeData({
                symbol: "",
                name: "",
                shares: 0,
                price: 0,
                journalId: ""
            })

            alert("Compra realizada exitosamente")
        } catch (error) {
            console.error("Error executing buy:", error)
            alert("Error al realizar la compra")
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Cargando favoritos...</div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Star className="w-8 h-8 text-yellow-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Acciones Favoritas</h1>
                        <p className="text-sm text-gray-600">
                            Gestiona tus acciones favoritas para acceso rápido
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                    {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showAddForm ? "Cancelar" : "Agregar Favorito"}
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Buscar Acción</h3>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por símbolo o nombre (ej: AAPL, Apple)..."
                            value={favoriteSearch}
                            onChange={(e) => handleSearchFavorite(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Nota (opcional)
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: Tecnología, dividendos, crecimiento..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                    </div>

                    {isSearching && (
                        <div className="text-center py-4 text-gray-600">
                            Buscando...
                        </div>
                    )}

                    {searchResults.length > 0 && (
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                            {searchResults.map((stock, index) => (
                                <div
                                    key={`${stock.symbol}-${index}`}
                                    onClick={() => handleAddFavorite(stock)}
                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="font-semibold text-gray-900">{stock.symbol}</div>
                                    <div className="text-sm text-gray-600">{stock.name}</div>
                                    <div className="text-xs text-gray-500">{stock.exchange}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Favorites Grid */}
            {favorites.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No tienes favoritos aún
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Agrega acciones a tus favoritos para acceso rápido
                    </p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar Primer Favorito
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((favorite) => {
                        const quote = favoriteQuotes[favorite.symbol]
                        const chartData = favoriteChartData[favorite.symbol] || []
                        const isLoading = loadingFavorites.has(favorite.symbol)

                        return (
                            <div
                                key={favorite.id}
                                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {favorite.symbol}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-gray-600 truncate">{favorite.name}</p>
                                            {favorite.note && (
                                                <p className="text-xs text-gray-500 mt-2 italic line-clamp-2">
                                                    "{favorite.note}"
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFavorite(favorite.id)}
                                            className="text-gray-400 hover:text-red-600"
                                            title="Eliminar"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Precio y Cambio */}
                                    {isLoading ? (
                                        <div className="text-center py-2 text-gray-400 text-sm">Cargando...</div>
                                    ) : quote ? (
                                        <div className="mb-3">
                                            <div className="text-2xl font-bold text-gray-900">
                                                ${quote.price?.toFixed(2) || 'N/A'}
                                            </div>
                                            <div className={`text-sm font-semibold ${(quote.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {(quote.change || 0) >= 0 ? '+' : ''}{quote.change?.toFixed(2) || '0.00'}
                                                ({(quote.changePercent || 0) >= 0 ? '+' : ''}{quote.changePercent?.toFixed(2) || '0.00'}%)
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* Mini Gráfico */}
                                    {chartData.length > 0 && (
                                        <div className="mb-3 bg-gray-50 rounded-lg p-2">
                                            <ResponsiveContainer width="100%" height={120}>
                                                <AreaChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id={`gradient-${favorite.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Area
                                                        type="monotone"
                                                        dataKey="close"
                                                        stroke="#3b82f6"
                                                        strokeWidth={1.5}
                                                        fill={`url(#gradient-${favorite.symbol})`}
                                                        dot={false}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                            <div className="text-xs text-gray-500 text-center mt-1">Últimos 5 días</div>
                                        </div>
                                    )}

                                    {/* Botones de acción */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleQuickBuy(favorite.symbol, favorite.name)}
                                            className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-md hover:bg-gray-800 flex items-center justify-center gap-2 text-sm"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            Comprar
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedFavorite(favorite)
                                                setNote(favorite.note || "")
                                            }}
                                            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm text-gray-700"
                                        >
                                            Nota
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Edit Note Modal */}
            {selectedFavorite && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Editar Nota - {selectedFavorite.symbol}
                        </h3>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Escribe una nota..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 mb-4 text-gray-900"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setSelectedFavorite(null)
                                    setNote("")
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleUpdateNote(selectedFavorite.id, note)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Buy Modal */}
            {showBuyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Comprar {tradeData.symbol}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">{tradeData.name}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Diario
                                </label>
                                <select
                                    value={tradeData.journalId}
                                    onChange={(e) => setTradeData({ ...tradeData, journalId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                                >
                                    <option value="">Seleccionar diario</option>
                                    {journals.map((journal: any) => (
                                        <option key={journal.id} value={journal.id}>
                                            {journal.name} ({journal.currency?.symbol || '$'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cantidad de acciones
                                </label>
                                <input
                                    type="number"
                                    value={tradeData.shares || ""}
                                    onChange={(e) => setTradeData({ ...tradeData, shares: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="0"
                                    min="0"
                                    step="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio por acción
                                </label>
                                <input
                                    type="number"
                                    value={tradeData.price || ""}
                                    onChange={(e) => setTradeData({ ...tradeData, price: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total:</span>
                                    <span className="font-semibold text-gray-900">
                                        ${(tradeData.shares * tradeData.price).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-6">
                            <button
                                onClick={() => {
                                    setShowBuyModal(false)
                                    setTradeData({
                                        symbol: "",
                                        name: "",
                                        shares: 0,
                                        price: 0,
                                        journalId: ""
                                    })
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleExecuteBuy}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                Comprar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
