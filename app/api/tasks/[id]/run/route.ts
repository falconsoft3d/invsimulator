import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { AIService } from "@/lib/ai/aiServiceV2"

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

            // Buffer para acumular el log completo
            let logBuffer = `1- INICIO: Encontrados ${botUsers.length} usuarios con configuración de bot válida.\n\n`

            const results = []

            for (const user of botUsers) {
                try {
                    logBuffer += `--------------------------------------------------\n`
                    logBuffer += `2- Procesando usuario: ${user.name} (ID: ${user.id})...\n`

                    // Analizar y obtener recomendaciones
                    const analysisResult = await AIService.analyzeAndRecommend(user.id)
                    const { recommendations, debug } = analysisResult

                    // Agregar info de debug al log unificado
                    logBuffer += `\n[DEBUG AI - ${debug.modelUsed}]\n`
                    logBuffer += `>> PROMPT ENVIADO:\n${debug.promptSent}\n`
                    logBuffer += `>> RESPUESTA CRUDA:\n${debug.rawResponse}\n`
                    if (debug.error) {
                        logBuffer += `!! ERROR INTERNO AI: ${debug.error}\n`
                    }

                    logBuffer += `\n3- RESPUESTA PARSEADA:\n   Recomendaciones: ${recommendations.length}\n`

                    if (recommendations.length > 0) {
                        try {
                            logBuffer += `   Detalle RAW (JSON): ${JSON.stringify(recommendations)}\n`
                        } catch (e) { }
                    }

                    if (!recommendations || recommendations.length === 0) {
                        logBuffer += `   AVISO: Lista vacía. El bot no operará.\n`

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

                    logBuffer += `4- EJECUCIÓN: ${executed.success} exitosas, ${executed.failed} fallidas.\n`

                    results.push({
                        userId: user.id,
                        userName: user.name,
                        success: true,
                        operations: executed,
                        recommendations: recommendations.length
                    })

                } catch (error: any) {
                    logBuffer += `ERROR procesando usuario ${user.name}: ${error.message}\n`
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

            // Calcular total de operaciones
            let totalOps = 0
            results.forEach(r => {
                if (r.operations) {
                    totalOps += r.operations.success
                }
            })

            const summaryMessage = `Bots ejecutados: ${totalSuccess} usuarios procesados (${totalOps} operaciones).`
            logBuffer += `\n==================================================\n`
            logBuffer += `RESUMEN FINAL: ${summaryMessage}`

            // Log FINAL UNIFICADO
            await prisma.systemLog.create({
                data: {
                    description: logBuffer,
                    origin: "AutoInvestmentTask"
                }
            })

            return NextResponse.json({
                success: true,
                message: summaryMessage,
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
