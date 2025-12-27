"use client"

import { useState, useEffect } from "react"
import { Star, Plus, Trash2, ShoppingCart, Search, X, TrendingDown } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer } from "recharts"

interface Favorite {
    id: string
    symbol: string
    name: string
    note?: string
}

interface SearchResult {
    symbol: string
    name: string
    exchange: string
}

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Favorite[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [favoriteSearch, setFavoriteSearch] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedFavorite, setSelectedFavorite] = useState<Favorite | null>(null)
    const [note, setNote] = useState("")
    const [favoriteChartData, setFavoriteChartData] = useState<Record<string, any[]>>({})
    const [favoriteQuotes, setFavoriteQuotes] = useState<Record<string, any>>({})
    const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(new Set())

    useEffect(() => {
        loadFavorites()
    }, [])

    const loadFavorites = async () => {
        try {
            const response = await fetch("/api/favorites")
            if (response.ok) {
                const data = await response.json()
                setFavorites(data)
                
                // Cargar datos de cotización y gráficos para cada favorito
                data.forEach((fav: Favorite) => {
                    loadFavoriteData(fav.symbol)
                })
            }
        } catch (error) {
            console.error("Error loading favorites:", error)
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

    const handleSearchFavorite = async (searchTerm: string) => {
        setFavoriteSearch(searchTerm)
        if (searchTerm.length < 1) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        try {
            const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchTerm)}`)
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

    const handleAddFavorite = async (stock: SearchResult) => {
        try {
            const response = await fetch("/api/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    symbol: stock.symbol,
                    name: stock.name,
                    note: note
                })
            })

            if (response.ok) {
                await loadFavorites()
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
            const response = await fetch(`/api/favorites/${id}`, {
                method: "DELETE"
            })

            if (response.ok) {
                await loadFavorites()
            }
        } catch (error) {
            console.error("Error removing favorite:", error)
        }
    }

    const handleUpdateNote = async (id: string, newNote: string) => {
        try {
            const response = await fetch(`/api/favorites/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note: newNote })
            })

            if (response.ok) {
                await loadFavorites()
                setSelectedFavorite(null)
            }
        } catch (error) {
            console.error("Error updating note:", error)
        }
    }

    const handleQuickBuy = (symbol: string, name: string) => {
        // Redirigir a página de inversiones con parámetros
        window.location.href = `/dashboard/investments?action=buy&symbol=${symbol}&name=${encodeURIComponent(name)}`
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
                    {favorites.map((favorite) => (
                        <div
                            key={favorite.id}
                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {favorite.symbol}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-600">{favorite.name}</p>
                                    {favorite.note && (
                                        <p className="text-xs text-gray-500 mt-2 italic">
                                            "{favorite.note}"
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleRemoveFavorite(favorite.id)}
                                    className="text-red-600 hover:text-red-700 p-1"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleQuickBuy(favorite.symbol, favorite.name)}
                                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
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
                                    Editar Nota
                                </button>
                            </div>
                        </div>
                    ))}
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
        </div>
    )
}
