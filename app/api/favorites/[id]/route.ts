import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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

        await prisma.stockFavorite.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[FAVORITE_DELETE]", error)
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
        const { note } = body

        const favorite = await prisma.stockFavorite.update({
            where: { id },
            data: { note }
        })

        return NextResponse.json(favorite)
    } catch (error) {
        console.error("[FAVORITE_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
