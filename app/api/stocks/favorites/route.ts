import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Obtener todos los favoritos
export async function GET() {
    try {
        const favorites = await prisma.stockFavorite.findMany({
            orderBy: {
                createdAt: "desc"
            }
        })

        return NextResponse.json(favorites)
    } catch (error) {
        console.error("Error fetching favorites:", error)
        return NextResponse.json(
            { error: "Error al obtener favoritos" },
            { status: 500 }
        )
    }
}

// POST - Agregar un nuevo favorito
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { symbol, name, note } = body

        if (!symbol || !name) {
            return NextResponse.json(
                { error: "Símbolo y nombre son requeridos" },
                { status: 400 }
            )
        }

        // Verificar si ya existe
        const existing = await prisma.stockFavorite.findUnique({
            where: { symbol }
        })

        if (existing) {
            return NextResponse.json(
                { error: "Este símbolo ya está en favoritos" },
                { status: 400 }
            )
        }

        const favorite = await prisma.stockFavorite.create({
            data: {
                symbol,
                name,
                note: note || null
            }
        })

        return NextResponse.json(favorite, { status: 201 })
    } catch (error) {
        console.error("Error creating favorite:", error)
        return NextResponse.json(
            { error: "Error al crear favorito" },
            { status: 500 }
        )
    }
}
