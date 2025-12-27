import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TransactionsClient from "./TransactionsClient"

export default async function TransactionsPage() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    // Obtener información del usuario actual para verificar rol
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user?.email || "" },
        select: { id: true, role: true }
    })

    if (!currentUser) {
        redirect("/login")
    }

    // Si es admin, ve todo (where vacío). Si es usuario, filtra por su ID.
    const whereClause: any = currentUser.role === "admin" ? {} : { userId: currentUser.id }

    const transactionsRaw = await prisma.stockInvestment.findMany({
        where: whereClause,
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
