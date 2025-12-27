import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TransactionsClient from "./TransactionsClient"

export default async function TransactionsPage() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    const transactionsRaw = await prisma.stockInvestment.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            journal: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    // Convertir Decimal a number para evitar errores de serialización
    const transactions = transactionsRaw.map((t) => ({
        ...t,
        shares: Number(t.shares),
        buyPrice: Number(t.buyPrice),
        currentPrice: Number(t.currentPrice),
        totalInvested: Number(t.totalInvested),
        currentValue: Number(t.currentValue),
        profitLoss: Number(t.profitLoss),
        profitLossPercent: Number(t.profitLossPercent),
        closePrice: t.closePrice ? Number(t.closePrice) : null,
    }))

    return <TransactionsClient transactions={transactions} />
}
