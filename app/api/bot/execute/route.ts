import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { AIService } from "@/lib/ai/aiServiceV2"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/bot/execute
 * Ejecuta el bot completo: analiza y ejecuta recomendaciones automáticamente
 */
export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { userId } = await req.json()

        if (!userId) {
            return NextResponse.json(
                { error: "userId es requerido" },
                { status: 400 }
            )
        }

        // Verificar que el usuario tenga botMode activado
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                botMode: true,
                aiModelId: true,
                aiPrompt: true
            }
        })

        if (!user || !user.botMode) {
            return NextResponse.json(
                { error: "Usuario no tiene modo bot activado" },
                { status: 400 }
            )
        }

        if (!user.aiModelId || !user.aiPrompt) {
            return NextResponse.json(
                { error: "Usuario no tiene configuración de IA completa" },
                { status: 400 }
            )
        }

        console.log(`[BOT] Ejecutando bot para usuario: ${user.name}`)

        // 1. Analizar y obtener recomendaciones
        const analysisResult = await AIService.analyzeAndRecommend(userId)
        const recommendations = analysisResult.recommendations

        console.log(`[BOT] Recomendaciones generadas: ${recommendations.length}`)

        if (recommendations.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No hay recomendaciones en este momento",
                recommendations: [],
                executed: { success: 0, failed: 0, errors: [] }
            })
        }

        // 2. Ejecutar recomendaciones
        const result = await AIService.executeRecommendations(userId, recommendations)

        console.log(`[BOT] Ejecutadas: ${result.success} exitosas, ${result.failed} fallidas`)

        return NextResponse.json({
            success: true,
            message: `Bot ejecutado: ${result.success} operaciones exitosas, ${result.failed} fallidas`,
            recommendations,
            executed: result
        })
    } catch (error: any) {
        console.error("[BOT_EXECUTE]", error)
        return NextResponse.json(
            { error: error.message || "Error al ejecutar bot" },
            { status: 500 }
        )
    }
}
