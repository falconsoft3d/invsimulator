import { prisma } from "@/lib/prisma"

interface AIModelConfig {
    apiKey?: string
    baseUrl?: string
    modelName?: string
    temperature?: number
}

interface InvestmentRecommendation {
    action: "buy" | "sell" | "hold"
    symbol: string
    shares: number
    reason: string
    confidence: number
}

export class AIService {
    /**
     * Analiza el historial y genera recomendaciones de inversión
     */
    static async analyzeAndRecommend(userId: string): Promise<InvestmentRecommendation[]> {
        // 1. Obtener usuario con su configuración de IA
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                aiModel: true,
                investments: {
                    where: { status: "activa" },
                    orderBy: { createdAt: "desc" },
                    take: 20
                }
            }
        })

        if (!user || !user.aiModel || !user.botMode) {
            throw new Error("Usuario no tiene configuración de IA o bot desactivado")
        }

        // 2. Obtener historial de transacciones
        const transactions = await prisma.stockInvestment.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                journal: true
            }
        })

        // 3. Obtener capital disponible
        const payments = await prisma.payment.findMany({
            where: { userId }
        })

        const totalEntradas = payments
            .filter(p => p.type === "Entrada")
            .reduce((sum, p) => sum + Number(p.amount), 0)

        const totalSalidas = payments
            .filter(p => p.type === "Salida")
            .reduce((sum, p) => sum + Number(p.amount), 0)

        const availableCapital = totalEntradas - totalSalidas

        // 4. Preparar contexto para la IA
        const context = this.buildContext(user, transactions, availableCapital)

        // 5. Llamar a la IA según el tipo
        const config = user.aiModel.config as AIModelConfig
        let recommendations: InvestmentRecommendation[] = []

        if (user.aiModel.type === "OPENAI") {
            recommendations = await this.callOpenAI(config, user.aiPrompt || "", context)
        } else if (user.aiModel.type === "OLLAMA") {
            recommendations = await this.callOllama(config, user.aiPrompt || "", context)
        }

        return recommendations
    }

    /**
     * Construye el contexto para la IA
     */
    private static buildContext(user: any, transactions: any[], availableCapital: number): string {
        const activeInvestments = user.investments.map((inv: any) => ({
            symbol: inv.symbol,
            shares: Number(inv.shares),
            buyPrice: Number(inv.buyPrice),
            currentPrice: Number(inv.currentPrice),
            profitLoss: Number(inv.profitLoss),
            profitLossPercent: Number(inv.profitLossPercent)
        }))

        const recentTransactions = transactions.slice(0, 10).map(t => ({
            symbol: t.symbol,
            shares: Number(t.shares),
            buyPrice: Number(t.buyPrice),
            status: t.status,
            profitLoss: Number(t.profitLoss),
            date: t.createdAt
        }))

        return `
INFORMACIÓN DEL USUARIO:
- Capital disponible: $${availableCapital.toFixed(2)}
- Inversiones activas: ${activeInvestments.length}

INVERSIONES ACTUALES:
${activeInvestments.map(inv =>
            `- ${inv.symbol}: ${inv.shares} acciones @ $${inv.buyPrice} (Actual: $${inv.currentPrice}, P/L: ${inv.profitLossPercent.toFixed(2)}%)`
        ).join('\n')}

HISTORIAL RECIENTE (últimas 10 transacciones):
${recentTransactions.map(t =>
            `- ${t.symbol}: ${t.shares} acciones @ $${t.buyPrice} - ${t.status} (P/L: $${t.profitLoss})`
        ).join('\n')}

FECHA ACTUAL: ${new Date().toISOString()}
`
    }

    /**
     * Llama a OpenAI para obtener recomendaciones
     */
    private static async callOpenAI(
        config: AIModelConfig,
        userPrompt: string,
        context: string
    ): Promise<InvestmentRecommendation[]> {
        const apiKey = config.apiKey
        const modelName = config.modelName || "gpt-4"
        const baseUrl = config.baseUrl || "https://api.openai.com/v1"

        if (!apiKey) {
            throw new Error("API Key de OpenAI no configurada")
        }

        const systemPrompt = `${userPrompt}

INSTRUCCIONES IMPORTANTES:
1. Analiza el contexto del usuario (capital, inversiones actuales, historial)
2. Genera recomendaciones de inversión (comprar, vender o mantener)
3. Responde ÚNICAMENTE con un JSON válido en este formato:
[
  {
    "action": "buy" | "sell" | "hold",
    "symbol": "SÍMBOLO",
    "shares": número_de_acciones,
    "reason": "razón de la recomendación",
    "confidence": número_entre_0_y_1
  }
]

REGLAS:
- Solo recomienda acciones reales del mercado (NYSE, NASDAQ)
- No gastes más del 80% del capital disponible
- Diversifica las inversiones
- Considera el historial de rendimiento del usuario
- Si no hay buenas oportunidades, responde con un array vacío []`

        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: context }
                    ],
                    temperature: config.temperature || 0.7,
                    response_format: { type: "json_object" }
                })
            })

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`)
            }

            const data = await response.json()
            const content = data.choices[0].message.content

            // Parsear la respuesta JSON
            const recommendations = JSON.parse(content)

            // Si la respuesta es un objeto con una propiedad "recommendations", extraerla
            if (Array.isArray(recommendations.recommendations)) {
                return recommendations.recommendations
            }

            // Si ya es un array, devolverlo
            if (Array.isArray(recommendations)) {
                return recommendations
            }

            return []
        } catch (error) {
            console.error("Error calling OpenAI:", error)
            return []
        }
    }

    /**
     * Llama a Ollama para obtener recomendaciones
     */
    private static async callOllama(
        config: AIModelConfig,
        userPrompt: string,
        context: string
    ): Promise<InvestmentRecommendation[]> {
        const baseUrl = config.baseUrl || "http://localhost:11434"
        const modelName = config.modelName || "llama2"

        const systemPrompt = `${userPrompt}

INSTRUCCIONES IMPORTANTES:
Responde ÚNICAMENTE con un JSON válido en este formato:
[
  {
    "action": "buy" | "sell" | "hold",
    "symbol": "SÍMBOLO",
    "shares": número,
    "reason": "razón",
    "confidence": número_entre_0_y_1
  }
]`

        try {
            const response = await fetch(`${baseUrl}/api/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelName,
                    prompt: `${systemPrompt}\n\n${context}`,
                    stream: false,
                    format: "json"
                })
            })

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`)
            }

            const data = await response.json()
            const recommendations = JSON.parse(data.response)

            if (Array.isArray(recommendations)) {
                return recommendations
            }

            return []
        } catch (error) {
            console.error("Error calling Ollama:", error)
            return []
        }
    }

    /**
     * Ejecuta las recomendaciones de inversión
     */
    static async executeRecommendations(
        userId: string,
        recommendations: InvestmentRecommendation[]
    ): Promise<{ success: number; failed: number; errors: string[] }> {
        let success = 0
        let failed = 0
        const errors: string[] = []

        for (const rec of recommendations) {
            try {
                if (rec.action === "buy") {
                    await this.executeBuy(userId, rec)
                    success++
                } else if (rec.action === "sell") {
                    await this.executeSell(userId, rec)
                    success++
                }
                // "hold" no hace nada
            } catch (error: any) {
                failed++
                errors.push(`${rec.symbol}: ${error.message}`)
            }
        }

        return { success, failed, errors }
    }

    /**
     * Ejecuta una compra
     */
    private static async executeBuy(userId: string, rec: InvestmentRecommendation) {
        // Obtener precio actual
        const quoteRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stocks/quote?symbol=${rec.symbol}`)

        if (!quoteRes.ok) {
            throw new Error("No se pudo obtener el precio actual")
        }

        const quoteData = await quoteRes.json()
        const currentPrice = quoteData.price

        if (!currentPrice) {
            throw new Error("Precio no disponible")
        }

        // Obtener journal del usuario (usar el primero disponible)
        const journal = await prisma.journal.findFirst({
            where: {
                payments: {
                    some: {
                        userId
                    }
                }
            }
        })

        const totalInvested = rec.shares * currentPrice
        const currentValue = totalInvested

        // Crear la inversión
        await prisma.stockInvestment.create({
            data: {
                symbol: rec.symbol,
                name: rec.symbol, // Podríamos obtener el nombre real de la API
                shares: rec.shares,
                buyPrice: currentPrice,
                currentPrice: currentPrice,
                totalInvested,
                currentValue,
                profitLoss: 0,
                profitLossPercent: 0,
                buyDate: new Date(),
                journalId: journal?.id || null,
                userId,
                status: "activa"
            }
        })

        // Crear pago de salida
        if (journal) {
            await prisma.payment.create({
                data: {
                    type: "Salida",
                    amount: totalInvested,
                    reference: `[BOT] Compra de ${rec.shares} acciones de ${rec.symbol} @ $${currentPrice.toFixed(2)} - ${rec.reason}`,
                    date: new Date(),
                    journalId: journal.id,
                    userId
                }
            })
        }
    }

    /**
     * Ejecuta una venta
     */
    private static async executeSell(userId: string, rec: InvestmentRecommendation) {
        // Buscar la inversión activa
        const investment = await prisma.stockInvestment.findFirst({
            where: {
                userId,
                symbol: rec.symbol,
                status: "activa"
            }
        })

        if (!investment) {
            throw new Error("No se encontró inversión activa para vender")
        }

        // Obtener precio actual
        const quoteRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stocks/quote?symbol=${rec.symbol}`)

        if (!quoteRes.ok) {
            throw new Error("No se pudo obtener el precio actual")
        }

        const quoteData = await quoteRes.json()
        const currentPrice = quoteData.price

        if (!currentPrice) {
            throw new Error("Precio no disponible")
        }

        const sellValue = Math.abs(Number(investment.shares)) * currentPrice

        // Marcar como cerrada
        await prisma.stockInvestment.update({
            where: { id: investment.id },
            data: {
                status: "cerrada",
                closeDate: new Date(),
                closePrice: currentPrice
            }
        })

        // Crear pago de entrada
        if (investment.journalId) {
            await prisma.payment.create({
                data: {
                    type: "Entrada",
                    amount: sellValue,
                    reference: `[BOT] Venta de ${Math.abs(Number(investment.shares))} acciones de ${rec.symbol} @ $${currentPrice.toFixed(2)} - ${rec.reason}`,
                    date: new Date(),
                    journalId: investment.journalId,
                    userId
                }
            })
        }
    }
}
