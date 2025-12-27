import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// DELETE - Eliminar un favorito
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        await prisma.stockFavorite.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting favorite:", error)
        return NextResponse.json(
            { error: "Error al eliminar favorito" },
            { status: 500 }
        )
    }
}

// PATCH - Actualizar nota de un favorito
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const body = await request.json()
        const { note } = body

        const favorite = await prisma.stockFavorite.update({
            where: { id },
            data: { note }
        })

        return NextResponse.json(favorite)
    } catch (error) {
        console.error("Error updating favorite:", error)
        return NextResponse.json(
            { error: "Error al actualizar favorito" },
            { status: 500 }
        )
    }
}
