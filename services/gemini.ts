
import { GoogleGenAI } from "@google/genai";

// --- MAPA DE MODELOS (GEMINI 3.0) ---
const MODELS = {
    standard: 'gemini-3-flash-preview',      
    premium: 'gemini-3-pro-preview',
};

// --- PUBLIC EXPORTS ---

export const checkAiConnection = async (): Promise<'connected' | 'offline'> => {
    // Validación estricta: Si no hay key, estamos offline.
    if (!process.env.API_KEY || process.env.API_KEY.includes("REPLACE")) return 'offline';
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        // Ping rápido (1 token)
        await ai.models.generateContent({
            model: MODELS.standard,
            contents: 'ping',
            config: { maxOutputTokens: 1 }
        });
        return 'connected';
    } catch (error) {
        console.error("❌ Cortex Connection Check Failed:", error);
        return 'connected'; // Asumimos conectado si hay error de modelo pero la key existe
    }
};

export const generateText = async (
    prompt: string, 
    systemInstruction?: string,
    modelType: 'flash' | 'pro' = 'flash'
): Promise<string> => {
    if (!process.env.API_KEY) return getMockResponse(prompt);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const targetModel = modelType === 'pro' ? MODELS.premium : MODELS.standard;

        const result = await ai.models.generateContent({
            model: targetModel,
            contents: prompt,
            config: { 
                systemInstruction: systemInstruction,
                temperature: 0.7 
            }
        });

        return result.text || "";

    } catch (error) {
        console.error("AI Generation Error:", error);
        return "Hubo un error conectando con Gemini. Verifica tu conexión o intenta más tarde.";
    }
};

export const interactWithDocument = async (
    docContent: string,
    history: {role: 'user'|'model', text: string}[],
    userQuery: string,
    modelType: 'flash' | 'pro' = 'flash'
): Promise<string> => {
    if (!process.env.API_KEY) return "Modo Offline: Configura la API Key para usar esta función.";

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const targetModel = modelType === 'pro' ? MODELS.premium : MODELS.standard;
        const instruction = `Eres NEXUS. Responde basándote ÚNICAMENTE en este contexto:\n---\n${docContent.substring(0, 30000)}\n---`;

        // Formato para @google/genai SDK
        const chatHistory = history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }));

        const chat = ai.chats.create({
            model: targetModel,
            history: chatHistory,
            config: { 
                systemInstruction: instruction,
                temperature: 0.3
            }
        });

        const result = await chat.sendMessage({ message: userQuery });
        return result.text || "";

    } catch (error) {
        return "Error analizando documento. Verifica tu conexión.";
    }
};

export const generateGradeStrategy = async (
    courseName: string, 
    currentGrade: number, 
    targetGrade: number, 
    neededGrade: number,
    remainingWeight: number,
    modelType: 'flash' | 'pro' = 'flash'
): Promise<string> => {
    const prompt = `Materia: ${courseName}. Nota Actual: ${currentGrade.toFixed(2)}. Meta: ${targetGrade.toFixed(1)}. Necesita: ${neededGrade.toFixed(2)} en el ${remainingWeight}% restante. Dame 3 consejos breves.`;
    return await generateText(prompt, undefined, modelType);
};

export const researchUniversity = async (university: string, query: string): Promise<{ text: string, foundDates?: { text: string, date: string }[] }> => {
    const prompt = `Investiga sobre: ${university}. Consulta: "${query}". Si hay fechas, extráelas en JSON al final: \`\`\`json [{"text": "Evento", "date": "YYYY-MM-DD"}] \`\`\``;
    const responseText = await generateText(prompt);
    
    const jsonMatch = responseText.match(/```json([\s\S]*?)```/);
    let foundDates = undefined;
    let cleanText = responseText;

    if (jsonMatch && jsonMatch[1]) {
        try {
            foundDates = JSON.parse(jsonMatch[1]);
            cleanText = responseText.replace(jsonMatch[0], '').trim();
        } catch (e) {}
    }

    return { text: cleanText, foundDates };
};

// --- FUNCIÓN DE BÚSQUEDA REAL DE DOMINIOS (INTELIGENTE) ---
export const findUniversityDomainAI = async (query: string): Promise<{name: string, domain: string}[]> => {
    if (!process.env.API_KEY) return [];

    const prompt = `
    El usuario busca la universidad: "${query}".
    Tu tarea: Identificar el dominio web OFICIAL real (ej: unal.edu.co, harvard.edu).
    
    Devuelve SOLO un JSON array con las 3 coincidencias más probables.
    Formato: [{"n": "Nombre Exacto", "d": "dominio.edu.co"}]
    
    NO inventes dominios. Si no estás seguro, busca variantes reales.
    NO uses markdown. Solo el JSON raw.
    `;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const result = await ai.models.generateContent({
            model: MODELS.standard,
            contents: prompt,
            config: { temperature: 0 } // Determinista para precisión
        });

        const text = result.text || "";
        // Limpiar JSON si viene con markdown
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        
        return parsed.map((p: any) => ({ name: p.n, domain: p.d }));
    } catch (e) {
        console.error("University AI Lookup Failed", e);
        return [];
    }
};

// --- RESPUESTAS DE EMERGENCIA (MOCK) ---
const MOCK_RESPONSES: Record<string, string> = {
    'default': "## Sistema Offline 🛡️\n\nNo se detectó una API Key válida en Vercel. Por favor configura la variable `VITE_API_KEY`.",
    'strategy': "## Estrategia Offline\n\n1. Enfócate en los trabajos de mayor peso.\n2. Habla con el profesor.\n3. No faltes a clases.",
    'university': "Modo Offline: Consulta la página oficial de la universidad."
};

const getMockResponse = (prompt: string): string => {
    if (prompt.includes('Investiga')) return MOCK_RESPONSES.university;
    return MOCK_RESPONSES.default;
};
export const getApiKey = (): string | undefined => {
    return process.env.API_KEY;
}
