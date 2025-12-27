import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const investments = await prisma.stockInvestment.findMany({
            orderBy: [
                { buyDate: "desc" },
                { createdAt: "desc" }
            ],
            include: {
                journal: {
                    include: {
                        currency: true
                    }
                }
            }
        })
        return NextResponse.json(investments)
    } catch (error) {
        console.error("[INVESTMENTS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { symbol, name, shares, buyPrice, journalId, buyDate } = body

        if (!symbol || !name || !shares || !buyPrice) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        // Calcular valores iniciales
        const totalInvested = Number(shares) * Number(buyPrice)
        const currentPrice = Number(buyPrice) // Al crear, el precio actual es igual al de compra
        const currentValue = Number(shares) * currentPrice
        const profitLoss = 0
        const profitLossPercent = 0

        const investment = await prisma.stockInvestment.create({
            data: {
                symbol,
                name,
                shares: Number(shares),
                buyPrice: Number(buyPrice),
                currentPrice,
                totalInvested,
                currentValue,
                profitLoss,
                profitLossPercent,
                buyDate: buyDate ? new Date(buyDate) : new Date(),
                journalId: journalId || null,
                userId: session.user.id,
                status: "activa"
            },
            include: {
                journal: {
                    include: {
                        currency: true
                    }
                }
            }
        })

        return NextResponse.json(investment)
    } catch (error) {
        console.error("[INVESTMENTS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
