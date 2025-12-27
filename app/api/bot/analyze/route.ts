import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { AIService } from "@/lib/ai/aiService"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/bot/analyze
 * Analiza y genera recomendaciones para un usuario específico
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

        // Analizar y obtener recomendaciones
        const recommendations = await AIService.analyzeAndRecommend(userId)

        return NextResponse.json({
            success: true,
            recommendations,
            count: recommendations.length
        })
    } catch (error: any) {
        console.error("[BOT_ANALYZE]", error)
        return NextResponse.json(
            { error: error.message || "Error al analizar" },
            { status: 500 }
        )
    }
}
