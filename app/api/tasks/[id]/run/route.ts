import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { AIService } from "@/lib/ai/aiService"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params

        const task = await prisma.scheduledTask.findUnique({
            where: { id },
        })

        if (!task) {
            return new NextResponse("Task not found", { status: 404 })
        }

        console.log(`[TASK_EXECUTION] Manual trigger for task: ${task.name} (${task.function})`)

        // Ejecutar la función según el tipo
        if (task.function === "runAIBots") {
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

            console.log(`[BOT] Ejecutando bots para ${botUsers.length} usuarios...`)

            const results = []

            for (const user of botUsers) {
                try {
                    console.log(`[BOT] Procesando usuario: ${user.name}`)

                    // Analizar y obtener recomendaciones
                    const recommendations = await AIService.analyzeAndRecommend(user.id)

                    if (recommendations.length === 0) {
                        results.push({
                            userId: user.id,
                            userName: user.name,
                            success: true,
                            message: "Sin recomendaciones"
                        })
                        continue
                    }

                    // Ejecutar recomendaciones
                    const executed = await AIService.executeRecommendations(user.id, recommendations)

                    results.push({
                        userId: user.id,
                        userName: user.name,
                        success: true,
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

            return NextResponse.json({
                success: true,
                message: `Bots ejecutados: ${totalSuccess} usuarios procesados, ${totalFailed} con errores`,
                results,
                summary: {
                    totalUsers: botUsers.length,
                    successful: totalSuccess,
                    failed: totalFailed
                }
            })
        }

        // Función genérica para otras tareas
        return NextResponse.json({
            success: true,
            message: `Task "${task.name}" execution started`
        })
    } catch (error: any) {
        console.error("[TASK_RUN_POST]", error)
        return NextResponse.json(
            { error: error.message || "Internal Error" },
            { status: 500 }
        )
    }
}
