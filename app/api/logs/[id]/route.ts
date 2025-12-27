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
        const logId = parseInt(id)

        if (isNaN(logId)) {
            return new NextResponse("Invalid ID", { status: 400 })
        }

        const log = await prisma.systemLog.findUnique({
            where: { id: logId },
        })

        if (!log) {
            return new NextResponse("Log not found", { status: 404 })
        }

        return NextResponse.json(log)
    } catch (error) {
        console.error("[LOG_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
