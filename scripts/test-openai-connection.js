const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("🤖 Test de Conexión OpenAI...")

    const user = await prisma.user.findFirst({
        where: { botMode: true },
        include: { aiModel: true }
    })

    if (!user) {
        console.error("❌ No hay usuario bot configurado.")
        return
    }

    if (!user.aiModel) {
        console.error("❌ El usuario bot no tiene modelo IA asignado.")
        return
    }

    const config = user.aiModel.config
    const apiKey = config.apiKey
    const modelName = config.modelName || "gpt-3.5-turbo" // Fallback si no hay nombre
    const baseUrl = config.baseUrl || "https://api.openai.com/v1"

    console.log(`📡 Conectando a ${baseUrl} con modelo ${modelName}...`)

    if (!apiKey) {
        console.error("❌ API Key no encontrada en config:", config)
        return
    }

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: "Responde solo con la palabra: OK" },
                    { role: "user", content: "Hola, ¿estás vivo?" }
                ]
            })
        })

        if (!response.ok) {
            console.error(`❌ Error HTTP: ${response.status} ${response.statusText}`)
            const text = await response.text()
            console.error("Respuesta:", text)
        } else {
            const data = await response.json()
            console.log("✅ ÉXITO! Respuesta:", data.choices[0].message.content)
        }

    } catch (error) {
        console.error("❌ Excepción fetch:", error)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
