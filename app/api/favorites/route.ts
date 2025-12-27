import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const favorites = await prisma.stockFavorite.findMany({
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(favorites)
    } catch (error) {
        console.error("[FAVORITES_GET]", error)
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
        const { symbol, name, note } = body

        if (!symbol || !name) {
            return new NextResponse("Symbol and name are required", { status: 400 })
        }

        const favorite = await prisma.stockFavorite.create({
            data: {
                symbol: symbol.toUpperCase(),
                name,
                note: note || null
            }
        })

        return NextResponse.json(favorite)
    } catch (error: any) {
        console.error("[FAVORITES_POST]", error)
        if (error.code === 'P2002') {
            return new NextResponse("Stock already in favorites", { status: 409 })
        }
        return new NextResponse("Internal Error", { status: 500 })
    }
}
