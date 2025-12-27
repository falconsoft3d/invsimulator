const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("🔍 Buscando últimos logs de IA...")

    const logs = await prisma.systemLog.findMany({
        where: {
            origin: "AIService"
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 6
    })

    if (logs.length === 0) {
        console.log("❌ No se encontraron logs de AIService.")
    } else {
        logs.reverse().forEach(log => {
            console.log("---------------------------------------------------")
            console.log(`📅 ${log.createdAt.toISOString()} | ID: ${log.id}`)
            console.log(`📝 ${log.description}`)
        })
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
