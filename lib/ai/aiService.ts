
// Este archivo es un placeholder para calmar el caché de compilación.
// La lógica real se ha movido a aiServiceV2.ts
export class AIService {
    static async analyzeAndRecommend(userId: string) {
        return {
            recommendations: [],
            debug: { promptSent: "", rawResponse: "", modelUsed: "dummy" }
        };
    }
    static async executeRecommendations(userId: string, recs: any[]) {
        return { success: 0, failed: 0, errors: [] };
    }
}
