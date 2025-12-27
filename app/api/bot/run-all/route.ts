import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { AIService } from "@/lib/ai/aiServiceV2"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/bot/run-all
 * Ejecuta el bot para TODOS los usuarios que tienen botMode activado
 * Este endpoint puede ser llamado por un cron job
 */
export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Solo admin puede ejecutar todos los bots
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user?.email || "" },
            select: { role: true }
        })

        if (currentUser?.role !== "admin") {
            return new NextResponse("Forbidden", { status: 403 })
        }

        console.log("[BOT] Iniciando ejecución de todos los bots...")

        // Obtener todos los usuarios con botMode activado
        const botUsers = await prisma.user.findMany({
            where: {
                botMode: true,
                aiModelId: { not: null },
                aiPrompt: { not: null }
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        })

        console.log(`[BOT] Encontrados ${botUsers.length} usuarios con bot activo`)

        const results = []

        for (const user of botUsers) {
            try {
                console.log(`[BOT] Procesando usuario: ${user.name} (${user.email})`)

                // Analizar y obtener recomendaciones
                const result = await AIService.analyzeAndRecommend(user.id)
                const recommendations = result.recommendations

                if (recommendations.length === 0) {
                    results.push({
                        userId: user.id,
                        userName: user.name,
                        success: true,
                        message: "Sin recomendaciones",
                        operations: { success: 0, failed: 0 }
                    })
                    continue
                }

                // Ejecutar recomendaciones
                const executed = await AIService.executeRecommendations(user.id, recommendations)

                results.push({
                    userId: user.id,
                    userName: user.name,
                    success: true,
                    message: `${executed.success} operaciones exitosas, ${executed.failed} fallidas`,
                    operations: executed,
                    recommendations: recommendations.length
                })

                console.log(`[BOT] Usuario ${user.name}: ${executed.success} exitosas, ${executed.failed} fallidas`)

            } catch (error: any) {
                console.error(`[BOT] Error procesando usuario ${user.name}:`, error)
                results.push({
                    userId: user.id,
                    userName: user.name,
                    success: false,
                    error: error.message
                })
            }
        }

        const totalSuccess = results.filter(r => r.success).length
        const totalFailed = results.filter(r => !r.success).length

        console.log(`[BOT] Finalizado: ${totalSuccess} usuarios procesados, ${totalFailed} con errores`)

        return NextResponse.json({
            success: true,
            message: `Procesados ${botUsers.length} usuarios: ${totalSuccess} exitosos, ${totalFailed} con errores`,
            results,
            summary: {
                totalUsers: botUsers.length,
                successful: totalSuccess,
                failed: totalFailed
            }
        })
    } catch (error: any) {
        console.error("[BOT_RUN_ALL]", error)
        return NextResponse.json(
            { error: error.message || "Error al ejecutar bots" },
            { status: 500 }
        )
    }
}
