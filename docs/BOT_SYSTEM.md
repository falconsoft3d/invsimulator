# 🤖 Sistema de Auto-Inversión con IA

## Descripción General

Este sistema permite que usuarios con configuración de IA ejecuten operaciones de inversión automáticamente basándose en:
- Historial de transacciones del usuario
- Capital disponible
- Análisis de mercado en tiempo real
- Prompt personalizado del usuario
- Modelo de IA configurado (OpenAI, Ollama, etc.)

## Arquitectura

```
┌─────────────────┐
│  Usuario con    │
│  Bot Mode ON    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  AIService.analyzeAndRecommend  │
│  ─────────────────────────────  │
│  1. Obtiene historial           │
│  2. Calcula capital disponible  │
│  3. Construye contexto          │
│  4. Llama a IA (OpenAI/Ollama)  │
│  5. Genera recomendaciones      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  AIService.executeRecommendations│
│  ─────────────────────────────  │
│  1. Valida recomendaciones      │
│  2. Obtiene precios actuales    │
│  3. Ejecuta compras/ventas      │
│  4. Registra pagos              │
│  5. Actualiza inversiones       │
└─────────────────────────────────┘
```

## Configuración Requerida

### 1. Configurar Modelo de IA

Ve a `/dashboard/ai-models` y crea un modelo con:

**Para OpenAI:**
```json
{
  "apiKey": "sk-...",
  "baseUrl": "https://api.openai.com/v1",
  "modelName": "gpt-4",
  "temperature": 0.7
}
```

**Para Ollama:**
```json
{
  "baseUrl": "http://localhost:11434",
  "modelName": "llama2",
  "temperature": 0.7
}
```

### 2. Configurar Usuario

Ve a `/dashboard/users/[id]/edit` y configura:

1. **Modelo de IA**: Selecciona el modelo creado
2. **Prompt de IA**: Define las instrucciones, por ejemplo:

```
Eres un asesor financiero experto especializado en inversiones en el mercado de valores.

TU ESTRATEGIA:
- Busca oportunidades de crecimiento a corto plazo
- Diversifica las inversiones en diferentes sectores
- Mantén un perfil de riesgo moderado
- Prioriza acciones tecnológicas y de energía renovable

REGLAS:
- No inviertas más del 20% del capital en una sola acción
- Vende si una inversión pierde más del 10%
- Toma ganancias cuando una inversión sube más del 15%
- Mantén al menos 30% del capital en efectivo
```

3. **Modo Bot**: Activa el checkbox "Modo Bot Activado"

## Uso del Sistema

### Opción 1: Ejecutar Bot para un Usuario Específico

**Endpoint:** `POST /api/bot/execute`

```bash
curl -X POST http://localhost:3000/api/bot/execute \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_id_aqui"}'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Bot ejecutado: 2 operaciones exitosas, 0 fallidas",
  "recommendations": [
    {
      "action": "buy",
      "symbol": "AAPL",
      "shares": 10,
      "reason": "Tendencia alcista confirmada",
      "confidence": 0.85
    }
  ],
  "executed": {
    "success": 2,
    "failed": 0,
    "errors": []
  }
}
```

### Opción 2: Solo Analizar (sin ejecutar)

**Endpoint:** `POST /api/bot/analyze`

```bash
curl -X POST http://localhost:3000/api/bot/analyze \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_id_aqui"}'
```

Esto solo genera recomendaciones sin ejecutarlas.

### Opción 3: Ejecutar TODOS los Bots (Admin)

**Endpoint:** `POST /api/bot/run-all`

```bash
curl -X POST http://localhost:3000/api/bot/run-all \
  -H "Content-Type: application/json"
```

Solo usuarios con rol `admin` pueden ejecutar este endpoint.

## Automatización con Cron Job

### Opción A: Vercel Cron Jobs

Crea un archivo `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/bot/run-all",
      "schedule": "0 9,15 * * 1-5"
    }
  ]
}
```

Esto ejecutará todos los bots a las 9 AM y 3 PM, de lunes a viernes.

### Opción B: GitHub Actions

Crea `.github/workflows/bot-cron.yml`:

```yaml
name: Run Investment Bots

on:
  schedule:
    - cron: '0 9,15 * * 1-5'  # 9 AM y 3 PM, lunes a viernes
  workflow_dispatch:  # Permite ejecución manual

jobs:
  run-bots:
    runs-on: ubuntu-latest
    steps:
      - name: Execute Bots
        run: |
          curl -X POST https://tu-dominio.com/api/bot/run-all \
            -H "Authorization: Bearer ${{ secrets.API_TOKEN }}"
```

### Opción C: Cron Local (Linux/Mac)

```bash
# Editar crontab
crontab -e

# Agregar línea (ejecutar a las 9 AM y 3 PM, lunes a viernes)
0 9,15 * * 1-5 curl -X POST http://localhost:3000/api/bot/run-all
```

## Contexto Enviado a la IA

La IA recibe el siguiente contexto:

```
INFORMACIÓN DEL USUARIO:
- Capital disponible: $10,000.00
- Inversiones activas: 3

INVERSIONES ACTUALES:
- AAPL: 10 acciones @ $150.00 (Actual: $155.00, P/L: 3.33%)
- GOOGL: 5 acciones @ $2800.00 (Actual: $2750.00, P/L: -1.79%)
- TSLA: 15 acciones @ $200.00 (Actual: $210.00, P/L: 5.00%)

HISTORIAL RECIENTE (últimas 10 transacciones):
- MSFT: 8 acciones @ $300.00 - cerrada (P/L: $80.00)
- NVDA: 12 acciones @ $450.00 - cerrada (P/L: $120.00)
...

FECHA ACTUAL: 2025-12-27T20:00:00.000Z
```

## Formato de Respuesta de la IA

La IA debe responder con un JSON válido:

```json
[
  {
    "action": "buy",
    "symbol": "AAPL",
    "shares": 10,
    "reason": "Tendencia alcista confirmada con RSI favorable",
    "confidence": 0.85
  },
  {
    "action": "sell",
    "symbol": "GOOGL",
    "reason": "Stop loss activado, pérdida del 10%",
    "confidence": 0.9
  },
  {
    "action": "hold",
    "symbol": "TSLA",
    "reason": "Mantener posición, tendencia neutral",
    "confidence": 0.7
  }
]
```

## Seguridad

1. **Autenticación**: Todos los endpoints requieren sesión activa
2. **Autorización**: Solo el usuario o admin puede ejecutar su bot
3. **Validación**: Se valida que el usuario tenga:
   - `botMode` activado
   - Modelo de IA configurado
   - Prompt definido
4. **Límites**: El bot respeta el capital disponible del usuario

## Monitoreo

Los logs del bot se pueden ver en:
- Console del servidor: `[BOT] ...`
- Historial de transacciones: `/dashboard/transactions`
- Referencias de pagos: Incluyen `[BOT]` al inicio

## Ejemplo de Prompt Avanzado

```
Eres un trader algorítmico experto con 20 años de experiencia.

FILOSOFÍA DE INVERSIÓN:
- Value investing combinado con momentum trading
- Análisis técnico y fundamental
- Gestión de riesgo estricta

ESTRATEGIA:
1. COMPRA cuando:
   - RSI < 30 (sobreventa)
   - Precio cerca de soporte
   - Volumen creciente
   - Sector en tendencia alcista

2. VENDE cuando:
   - Pérdida > 8% (stop loss)
   - Ganancia > 20% (take profit)
   - RSI > 70 (sobrecompra)
   - Señales de reversión

3. DIVERSIFICACIÓN:
   - Máximo 5 posiciones activas
   - No más del 25% en un sector
   - Mantén 20% en efectivo

SECTORES PREFERIDOS:
- Tecnología (40%)
- Salud (30%)
- Energía renovable (20%)
- Consumo (10%)

EVITA:
- Acciones con capitalización < $1B
- Empresas con deuda/equity > 2
- Sectores en declive estructural
```

## Troubleshooting

### Error: "Usuario no tiene configuración de IA completa"
- Verifica que el usuario tenga un modelo de IA asignado
- Verifica que el usuario tenga un prompt configurado

### Error: "API Key de OpenAI no configurada"
- Revisa la configuración del modelo de IA
- Asegúrate de que el campo `apiKey` esté en el JSON de config

### Error: "No se pudo obtener el precio actual"
- Verifica que el símbolo de la acción sea válido
- Revisa la conexión a la API de cotizaciones

### El bot no ejecuta operaciones
- Verifica que `botMode` esté activado
- Revisa los logs del servidor para ver las recomendaciones
- Verifica que haya capital disponible

## Próximas Mejoras

- [ ] Dashboard de control del bot
- [ ] Historial de ejecuciones del bot
- [ ] Backtesting de estrategias
- [ ] Alertas por email/SMS
- [ ] Límites de pérdida diaria
- [ ] Modo paper trading (simulación)
