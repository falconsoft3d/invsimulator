import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const payments = await prisma.payment.findMany({
            orderBy: [
                { date: "desc" },
                { createdAt: "desc" }
            ],
            include: {
                journal: true,
                contact: true,
                user: true
            }
        })
        return NextResponse.json(payments)
    } catch (error) {
        console.error("[PAYMENTS_GET]", error)
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
        const { type, journalId, amount, date, contactId, reference, userId } = body

        if (!type || !journalId) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        // Generar secuencia única basada en el tipo
        const prefix = type === "Entrada" ? "IN" : "OUT"
        const lastPayment = await prisma.payment.findFirst({
            where: {
                sequence: {
                    startsWith: prefix
                }
            },
            orderBy: {
                sequence: "desc"
            }
        })

        let nextNumber = 1
        if (lastPayment?.sequence) {
            const lastNumber = parseInt(lastPayment.sequence.replace(prefix, ""))
            nextNumber = lastNumber + 1
        }

        const sequence = `${prefix}${nextNumber.toString().padStart(4, '0')}`

        const payment = await prisma.payment.create({
            data: {
                sequence,
                reference,
                type,
                journalId,
                amount: amount || 0,
                date: date ? new Date(date) : new Date(), // Default to now if missing
                contactId: contactId || null,
                userId: userId || null,
            },
            include: {
                journal: true,
                contact: true,
                user: true
            }
        })

        return NextResponse.json(payment)
    } catch (error) {
        console.error("[PAYMENTS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
