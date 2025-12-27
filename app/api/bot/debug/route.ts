import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) return new NextResponse("Unauthorized", { status: 401 })

        const { userId } = await req.json()
        if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

        // 1. Obtener datos del usuario
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

        if (!user) return NextResponse.json({ error: "User not found" })

        // 2. Calcular capital
        const payments = await prisma.payment.findMany({ where: { userId } })
        const totalEntradas = payments.filter(p => p.type === "Entrada").reduce((sum, p) => sum + Number(p.amount), 0)
        const totalSalidas = payments.filter(p => p.type === "Salida").reduce((sum, p) => sum + Number(p.amount), 0)
        const availableCapital = totalEntradas - totalSalidas

        // 3. Preparar respuesta de diagnóstico
        const diagnosis = {
            user: {
                name: user.name,
                email: user.email,
                botMode: user.botMode,
                hasAiModel: !!user.aiModel,
                aiModelType: user.aiModel?.type,
                hasAiPrompt: !!user.aiPrompt
            },
            financials: {
                totalEntradas,
                totalSalidas,
                availableCapital,
                activeInvestmentsCount: user.investments.length
            },
            aiConfig: {
                promptLength: user.aiPrompt?.length || 0,
                modelConfig: user.aiModel?.config
            }
        }

        return NextResponse.json(diagnosis)

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
