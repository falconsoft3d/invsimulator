import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
    try {
        const { ids } = await request.json()

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json(
                { error: "Invalid request body. 'ids' must be an array." },
                { status: 400 }
            )
        }

        // Convertir strings a números si es necesario
        const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id))

        if (numericIds.length === 0) {
            return NextResponse.json(
                { message: "No valid IDs to delete" },
                { status: 200 }
            )
        }

        await prisma.systemLog.deleteMany({
            where: {
                id: {
                    in: numericIds
                }
            }
        })

        return NextResponse.json({ message: "Logs deleted successfully" })
    } catch (error) {
        console.error("Error bulk deleting logs:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
