"use client"

import { ArrowLeftRight } from "lucide-react"
import TableTemplate from "@/components/TableTemplate"

interface Transaction {
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
    buyDate: Date
    closeDate?: Date | null
    closePrice?: number | null
    status: string
    createdAt: Date
    user?: {
        id: string
        name: string | null
        email: string
    } | null
    journal?: {
        id: string
        name: string
        code: string
    } | null
}

export default function TransactionsClient({
    transactions,
}: {
    transactions: Transaction[]
}) {
    const columns = [
        {
            key: "buyDate",
            label: "Fecha Compra",
            render: (item: Transaction) => (
                <span className="text-sm text-gray-900">
                    {new Date(item.buyDate).toLocaleString("es-ES", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </span>
            ),
        },
        {
            key: "closeDate",
            label: "Fecha Cierre",
            render: (item: Transaction) => (
                item.closeDate ? (
                    <div className="text-sm">
                        <div className="text-gray-900">
                            {new Date(item.closeDate).toLocaleString("es-ES", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </div>
                        {item.closePrice && (
                            <div className="text-xs text-gray-500">
                                Precio: ${Number(item.closePrice).toFixed(2)}
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-sm text-gray-400">-</span>
                )
            ),
            searchable: false,
        },
        {
            key: "symbol",
            label: "Símbolo",
            render: (item: Transaction) => (
                <div>
                    <div className="font-semibold text-gray-900">{item.symbol}</div>
                    <div className="text-xs text-gray-500">{item.name}</div>
                </div>
            ),
        },
        {
            key: "shares",
            label: "Acciones",
            render: (item: Transaction) => {
                const shares = Number(item.shares)
                const isShort = shares < 0
                return (
                    <span className={`text-sm font-medium ${isShort ? "text-red-600" : "text-gray-900"}`}>
                        {isShort ? `${Math.abs(shares)} (Corto)` : shares}
                    </span>
                )
            },
        },
        {
            key: "buyPrice",
            label: "Precio Compra",
            render: (item: Transaction) => (
                <span className="text-sm text-gray-900">
                    ${Number(item.buyPrice).toFixed(2)}
                </span>
            ),
        },
        {
            key: "totalInvested",
            label: "Total Invertido",
            render: (item: Transaction) => (
                <span className="text-sm font-semibold text-gray-900">
                    ${Number(item.totalInvested).toFixed(2)}
                </span>
            ),
        },
        {
            key: "profitLoss",
            label: "Ganancia/Pérdida",
            render: (item: Transaction) => {
                const pl = Number(item.profitLoss)
                const plp = Number(item.profitLossPercent)
                return (
                    <div className={`text-sm font-semibold ${pl >= 0 ? "text-green-600" : "text-red-600"}`}>
                        <div>${pl.toFixed(2)}</div>
                        <div className="text-xs">
                            ({plp >= 0 ? "+" : ""}{plp.toFixed(2)}%)
                        </div>
                    </div>
                )
            },
        },
        {
            key: "status",
            label: "Estado",
            render: (item: Transaction) => (
                <span
                    className={`inline-block px-2 py-1 text-xs rounded ${item.status === "activa"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                        }`}
                >
                    {item.status}
                </span>
            ),
        },
        {
            key: "user",
            label: "Usuario",
            render: (item: Transaction) => (
                item.user ? (
                    <div className="text-sm">
                        <div className="font-medium text-gray-900">{item.user.name || "Sin nombre"}</div>
                        <div className="text-xs text-gray-500">{item.user.email}</div>
                    </div>
                ) : (
                    <span className="text-sm text-gray-400">-</span>
                )
            ),
            searchable: false,
        },
        {
            key: "journal",
            label: "Diario",
            render: (item: Transaction) => (
                item.journal ? (
                    <div className="text-sm">
                        <div className="font-medium text-gray-900">{item.journal.name}</div>
                        <div className="text-xs text-gray-500">{item.journal.code}</div>
                    </div>
                ) : (
                    <span className="text-sm text-gray-400">-</span>
                )
            ),
            searchable: false,
        },
    ]

    return (
        <div>
            <div className="mb-6 flex items-center gap-3">
                <ArrowLeftRight className="w-8 h-8 text-blue-600" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
                    <p className="text-sm text-gray-600">
                        Historial completo de todas las transacciones de inversión
                    </p>
                </div>
            </div>

            <TableTemplate
                title="Transacciones"
                data={transactions}
                columns={columns}
                searchPlaceholder="Buscar por símbolo, usuario, diario..."
                getItemId={(item) => item.id}
                itemsPerPage={20}
            />
        </div>
    )
}
