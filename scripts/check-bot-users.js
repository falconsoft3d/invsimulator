const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        where: { botMode: true },
        include: {
            investments: true,
            aiModel: true
        }
    })

    console.log(`Found ${users.length} bot users`)

    for (const user of users) {
        console.log(`\n-------------------`)
        console.log(`User: ${user.name} (${user.id})`)
        console.log(`Bot Mode: ${user.botMode}`)
        console.log(`AI Model: ${user.aiModel?.name} (${user.aiModel?.type})`)
        console.log(`Prompt Length: ${user.aiPrompt?.length || 0}`)

        // Calculate Capital
        const payments = await prisma.payment.findMany({ where: { userId: user.id } })
        const entradas = payments.filter(p => p.type === "Entrada").reduce((a, b) => a + Number(b.amount), 0)
        const salidas = payments.filter(p => p.type === "Salida").reduce((a, b) => a + Number(b.amount), 0)
        const capital = entradas - salidas

        console.log(`Capital Available: $${capital}`)

        if (capital <= 0) {
            console.log(`⚠️  WARNING: USER HAS NO capital! Bot will not trade.`)
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
