"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Database, Activity, Clock } from "lucide-react"

interface SystemLog {
    id: number
    description: string
    origin: string
    createdAt: string
}

export default function LogDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [log, setLog] = useState<SystemLog | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (params.id) {
            fetchLog(params.id as string)
        }
    }, [params.id])

    const fetchLog = async (id: string) => {
        try {
            const res = await fetch(`/api/logs/${id}`)
            if (res.ok) {
                const data = await res.json()
                setLog(data)
            }
        } catch (error) {
            console.error("Error fetching log:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando log...</div>
    }

    if (!log) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-800">Log no encontrado</h2>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    Volver
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-6 px-4">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Volver a Logs</span>
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">Detalle del Sistema</h1>
                            <p className="text-sm text-gray-500 font-mono">ID: #{log.id}</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Database size={14} />
                        {log.origin}
                    </span>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                            <Calendar size={16} />
                            Fecha y Hora
                        </h3>
                        <p className="text-gray-900 font-medium">
                            {new Date(log.createdAt).toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Descripción Completa</h3>
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 font-mono text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {log.description}
                        </div>
                    </div>

                    {/* Intentar parsear JSON si parece ser uno */}
                    {log.description.includes("{") && log.description.includes("}") && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Datos Estructurados (JSON Detectado)
                            </h3>
                            <TryJsonView content={log.description} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function TryJsonView({ content }: { content: string }) {
    try {
        // Intentar encontrar algo que parezca JSON dentro del texto
        const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
        if (!jsonMatch) return null

        const jsonStr = jsonMatch[0]
        const parsed = JSON.parse(jsonStr)

        return (
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 font-mono text-xs">
                    {JSON.stringify(parsed, null, 2)}
                </pre>
            </div>
        )
    } catch {
        return null
    }
}
