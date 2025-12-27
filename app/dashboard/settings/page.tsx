"use client"

import { useState, useEffect } from "react"
import { Settings, Save, AlertTriangle, CheckCircle, Database, Code, TrendingUp, Percent } from "lucide-react"

export default function SettingsPage() {
    const [enabled, setEnabled] = useState(false)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")
    const [brokerBuyCommission, setBrokerBuyCommission] = useState("0")
    const [brokerSellCommission, setBrokerSellCommission] = useState("0")
    const [savingCommissions, setSavingCommissions] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings")
            if (res.ok) {
                const data = await res.json()
                const enabledSetting = data.find((s: any) => s.key === "enable_universal_api")
                setEnabled(enabledSetting?.value === "true")
                
                const buyCommission = data.find((s: any) => s.key === "broker_buy_commission")
                setBrokerBuyCommission(buyCommission?.value || "0")
                
                const sellCommission = data.find((s: any) => s.key === "broker_sell_commission")
                setBrokerSellCommission(sellCommission?.value || "0")
            }
        } catch (error) {
            console.error("Error fetching settings:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = async (checked: boolean) => {
        setEnabled(checked)
        setMessage("")
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    key: "enable_universal_api",
                    value: String(checked)
                })
            })

            if (res.ok) {
                setMessage("Configuración guardada correctamente.")
                setTimeout(() => setMessage(""), 3000)
            }
        } catch (error) {
            console.error("Error saving setting:", error)
            setEnabled(!checked) // Revert on error
        }
    }

    const handleSaveCommissions = async () => {
        setSavingCommissions(true)
        setMessage("")
        try {
            await Promise.all([
                fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        key: "broker_buy_commission",
                        value: brokerBuyCommission,
                        description: "Comisión del broker por compra de acciones (%)"
                    })
                }),
                fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        key: "broker_sell_commission",
                        value: brokerSellCommission,
                        description: "Comisión del broker por venta de acciones (%)"
                    })
                })
            ])

            setMessage("Comisiones guardadas correctamente.")
            setTimeout(() => setMessage(""), 3000)
        } catch (error) {
            console.error("Error saving commissions:", error)
            setMessage("Error al guardar las comisiones.")
        } finally {
            setSavingCommissions(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Settings className="text-gray-600" />
                    Configuración del Sistema
                </h1>
                <p className="text-gray-600 text-sm">Administra las opciones globales de la aplicación.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-500" />
                        Comisiones del Broker
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Define las comisiones que se aplicarán en las operaciones de compra y venta de acciones.
                    </p>
                </div>

                <div className="p-6 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Percent size={16} className="text-green-600" />
                                    Comisión por Compra (%)
                                </div>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={brokerBuyCommission}
                                onChange={(e) => setBrokerBuyCommission(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="0.00"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Se agregará al costo total de compra
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Percent size={16} className="text-red-600" />
                                    Comisión por Venta (%)
                                </div>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={brokerSellCommission}
                                onChange={(e) => setBrokerSellCommission(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="0.00"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Se descontará del monto de venta
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSaveCommissions}
                            disabled={savingCommissions}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            <Save size={16} />
                            {savingCommissions ? "Guardando..." : "Guardar Comisiones"}
                        </button>
                    </div>

                    {/* Ejemplo de cálculo */}
                    {(parseFloat(brokerBuyCommission) > 0 || parseFloat(brokerSellCommission) > 0) && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <AlertTriangle size={16} />
                                Ejemplo de Aplicación
                            </h3>
                            <div className="text-sm text-blue-800 space-y-1">
                                {parseFloat(brokerBuyCommission) > 0 && (
                                    <p>• Compra de $1,000: Costo total = ${(1000 * (1 + parseFloat(brokerBuyCommission) / 100)).toFixed(2)}</p>
                                )}
                                {parseFloat(brokerSellCommission) > 0 && (
                                    <p>• Venta de $1,000: Ingreso neto = ${(1000 * (1 - parseFloat(brokerSellCommission) / 100)).toFixed(2)}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Database size={20} className="text-blue-500" />
                        API Universal
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Habilita el acceso directo a cualquier tabla de la base de datos a través de <code>/api/universal/[modelo]</code>.
                    </p>
                </div>

                <div className="p-6 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Database size={20} />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">Estado de la API</div>
                                <div className={`text-sm ${enabled ? 'text-green-600' : 'text-gray-500'}`}>
                                    {enabled ? "Activo - Acceso Permitido" : "Inactivo - Acceso Denegado"}
                                </div>
                            </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={enabled}
                                onChange={(e) => handleToggle(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {enabled && (
                        <div className="mt-8 border-t border-gray-100 pt-8">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                <Code size={20} className="text-purple-500" />
                                Documentación y Pruebas
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Documentation */}
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Endpoints Disponibles</h4>
                                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 font-mono text-sm space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">GET</span>
                                            <span className="text-gray-600">/api/universal/[modelo]</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">POST</span>
                                            <span className="text-gray-600">/api/universal/[modelo]</span>
                                        </div>
                                    </div>

                                    <h4 className="font-medium text-gray-700 mt-6 mb-2">Modelos Detectados</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {["user", "product", "contact", "currency", "aiModel", "ticket", "scheduledTask", "systemLog"].map(m => (
                                            <span key={m} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono border border-gray-200">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Tester */}
                                <ApiTester />
                            </div>
                        </div>
                    )}
                </div>

                {message && (
                    <div className="px-6 py-3 bg-green-50 border-t border-green-100 text-green-700 text-sm flex items-center gap-2">
                        <CheckCircle size={16} />
                        {message}
                    </div>
                )}
            </div>
        </div>
    )
}

function ApiTester() {
    const [model, setModel] = useState("user")
    const [method, setMethod] = useState("GET")
    const [response, setResponse] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [body, setBody] = useState("{}")

    const execute = async () => {
        setLoading(true)
        setResponse(null)
        try {
            const options: RequestInit = { method }
            if (method === "POST") {
                options.headers = { "Content-Type": "application/json" }
                options.body = body
            }

            const res = await fetch(`/api/universal/${model}`, options)
            let data
            try {
                data = await res.json()
            } catch (e) {
                data = { error: "Invalid JSON response", status: res.status }
            }
            setResponse(data)
        } catch (error) {
            setResponse({ error: String(error) })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg flex flex-col">
            <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center justify-between">
                <span className="text-gray-300 text-xs font-mono">Consola de Pruebas</span>
                <button
                    onClick={execute}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors disabled:opacity-50"
                >
                    {loading ? "Ejecutando..." : "Ejecutar"}
                </button>
            </div>

            <div className="p-4 space-y-4">
                <div className="flex gap-2">
                    <select
                        value={method}
                        onChange={e => setMethod(e.target.value)}
                        className="bg-gray-800 text-white text-sm border-gray-700 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                    </select>
                    <select
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        className="bg-gray-800 text-white text-sm border-gray-700 rounded px-2 py-1 flex-1 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                    >
                        {["user", "product", "contact", "currency", "aiModel", "ticket", "scheduledTask", "systemLog", "systemSetting"].map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                {method === "POST" && (
                    <div>
                        <label className="text-gray-500 text-xs mb-1 block">Body (JSON)</label>
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            className="w-full h-24 bg-gray-800 text-gray-300 text-xs font-mono p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                )}

                <div className="mt-2 text-white">
                    <label className="text-gray-500 text-xs mb-1 block">Respuesta</label>
                    <div className="w-full h-48 bg-black text-green-400 text-xs font-mono p-2 rounded overflow-auto border border-gray-800">
                        {response ? JSON.stringify(response, null, 2) : "// Esperando ejecución..."}
                    </div>
                </div>
            </div>
        </div>
    )
}
