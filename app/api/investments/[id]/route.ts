import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params

        const investment = await prisma.stockInvestment.findUnique({
            where: { id },
            include: {
                journal: {
                    include: {
                        currency: true
                    }
                }
            }
        })

        if (!investment) {
            return new NextResponse("Not Found", { status: 404 })
        }

        return NextResponse.json(investment)
    } catch (error) {
        console.error("[INVESTMENT_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params
        const body = await req.json()
        const { symbol, name, shares, buyPrice, currentPrice, journalId, status } = body

        // Calcular valores actualizados
        let updateData: any = {}
        
        if (symbol !== undefined) updateData.symbol = symbol
        if (name !== undefined) updateData.name = name
        if (shares !== undefined) updateData.shares = Number(shares)
        if (buyPrice !== undefined) updateData.buyPrice = Number(buyPrice)
        if (currentPrice !== undefined) updateData.currentPrice = Number(currentPrice)
        if (journalId !== undefined) updateData.journalId = journalId
        if (status !== undefined) updateData.status = status

        // Obtener datos actuales para calcular
        const current = await prisma.stockInvestment.findUnique({
            where: { id }
        })

        if (!current) {
            return new NextResponse("Not Found", { status: 404 })
        }

        // Usar valores actuales o actualizados
        const finalShares = Number(updateData.shares ?? current.shares)
        const finalBuyPrice = Number(updateData.buyPrice ?? current.buyPrice)
        const finalCurrentPrice = Number(updateData.currentPrice ?? current.currentPrice)

        // Recalcular valores
        updateData.totalInvested = finalShares * finalBuyPrice
        updateData.currentValue = finalShares * finalCurrentPrice
        updateData.profitLoss = updateData.currentValue - updateData.totalInvested
        updateData.profitLossPercent = updateData.totalInvested > 0 
            ? (updateData.profitLoss / updateData.totalInvested) * 100 
            : 0

        const investment = await prisma.stockInvestment.update({
            where: { id },
            data: updateData,
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
        console.error("[INVESTMENT_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params

        await prisma.stockInvestment.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[INVESTMENT_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
