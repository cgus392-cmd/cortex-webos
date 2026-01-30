
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// --- PROTOCOLO HYDRA: LISTA MAESTRA DE CLAVES ---
const RAW_KEYS = [
    // Prioridad 1: Variables de Entorno
    import.meta.env?.VITE_API_KEY,
    (typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined),
    
    // Prioridad 2: Nuevas Claves (Alta Disponibilidad)
    "AIzaSyDz1XHDlFzscEe1935chxppQbXl_sm0LR8",
    "AIzaSyDJtWVR_u-fseW77yf3mbqc6lAf1juJpDk",
    
    // Prioridad 3: Respaldo
    "AIzaSyAoJCjcjZxc9rla-I-BHjmmg72Ws4NIlKw",
    "AIzaSyD_piyBZMeCnE85O96tDgemeRatG3UyctI", 
    "AIzaSyDJh9lNsu-G83rP1fWWylpH48T0WjJAhA8",
    "AIzaSyA6ad4UWDIp4Len_uT2ZjoZt0zChFCmO2w"
];

// Filtramos claves duplicadas o vacías
const API_KEYS = Array.from(new Set(
    RAW_KEYS.filter(k => k && typeof k === 'string' && k.length > 20 && !k.includes("REPLACE"))
)) as string[];

const MODEL_MAP = {
    'flash': 'gemini-3-flash-preview',
    'pro': 'gemini-3-pro-preview'
};

// Variable para rastrear si estamos en modo emergencia total
let IS_OFFLINE_MODE = false;

// --- MOTOR DE ROTACIÓN (FAILOVER SYSTEM) ---
// Ejecuta una operación probando claves secuencialmente si fallan
async function withKeyRotation<T>(
    operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
    if (IS_OFFLINE_MODE) throw new Error("Offline Mode Active");

    let lastError: any;

    for (let i = 0; i < API_KEYS.length; i++) {
        const apiKey = API_KEYS[i];
        try {
            const ai = new GoogleGenAI({ apiKey });
            // Si la operación es exitosa, retornamos inmediatamente
            return await operation(ai);
        } catch (error: any) {
            console.warn(`⚠️ Clave ${i + 1}/${API_KEYS.length} falló:`, error.message || error);
            lastError = error;
            // Continuamos al siguiente loop (siguiente clave)
        }
    }

    // Si llegamos aquí, todas las claves fallaron
    throw lastError || new Error("Todas las API Keys fallaron.");
}

// --- MOCK ENGINE (RESPUESTAS PREDEFINIDAS) ---
const MOCK_RESPONSES: Record<string, string> = {
    'default': "## Sistema Offline 🛡️\n\nNo he podido establecer enlace con los servidores de Google ni siquiera rotando las credenciales de seguridad.\n\nEstoy operando con capacidad limitada. Puedo ayudarte a gestionar tareas localmente.",
    'math': "Modo Offline: Para resolver esto, recuerda identificar las variables y aplicar la fórmula correspondiente. No puedo calcularlo en tiempo real ahora mismo.",
    'strategy': "## Estrategia General (Offline)\n\n1. **Identifica el corte con mayor peso** y enfócate ahí.\n2. **Entrega todo**: Los ceros bajan mucho el promedio.\n3. **Asistencia**: No pierdas la materia por fallas.",
    'university': "## Información Offline\n\nNo tengo acceso a la red externa. Consulta directamente la página web de tu universidad para fechas exactas."
};

const getMockResponse = (prompt: string): string => {
    const p = prompt.toLowerCase();
    if (p.includes('matematica') || p.includes('calculo')) return MOCK_RESPONSES.math;
    if (p.includes('estrategia') || p.includes('nota')) return MOCK_RESPONSES.strategy;
    if (p.includes('investiga')) return MOCK_RESPONSES.university;
    return MOCK_RESPONSES.default;
};

/**
 * Validates connection trying ALL keys.
 */
export const checkAiConnection = async (): Promise<'connected' | 'offline'> => {
    try {
        if (API_KEYS.length === 0) throw new Error("No keys available");
        
        await withKeyRotation(async (ai) => {
            await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: 'ping',
            });
        });
        
        IS_OFFLINE_MODE = false;
        console.log("✅ Conexión establecida (Hydra Protocol)");
        return 'connected';
    } catch (error) {
        console.error("❌ Fallo Crítico: Todas las claves fallaron. Activando Modo Offline.", error);
        IS_OFFLINE_MODE = true;
        return 'offline';
    }
};

/**
 * Generates text response using Key Rotation
 */
export const generateText = async (
    prompt: string, 
    systemInstruction?: string,
    modelType: 'flash' | 'pro' = 'flash'
): Promise<string> => {
  try {
    const modelName = MODEL_MAP[modelType];

    const response = await withKeyRotation<GenerateContentResponse>(async (ai) => {
        return await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: modelType === 'pro' ? 0.4 : 0.7, 
            }
        });
    });

    return response.text || "Respuesta vacía.";
  } catch (error) {
    console.warn("AI Generation Failed -> Using Mock");
    return getMockResponse(prompt);
  }
};

/**
 * RAG Chat functionality
 */
export const interactWithDocument = async (
    docContent: string,
    history: {role: 'user'|'model', text: string}[],
    userQuery: string,
    modelType: 'flash' | 'pro' = 'flash'
): Promise<string> => {
    try {
        const modelName = MODEL_MAP[modelType];
        const systemInstruction = `Eres NEXUS. Responde basándote ÚNICAMENTE en el siguiente documento:\n---\n${docContent.substring(0, 90000)}\n---`;

        const chatHistory = history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }));

        const response = await withKeyRotation<GenerateContentResponse>(async (ai) => {
            const chat = ai.chats.create({
                model: modelName,
                config: { systemInstruction, temperature: 0.3 },
                history: chatHistory
            });
            return await chat.sendMessage({ message: userQuery });
        });

        return response.text || "Sin respuesta.";

    } catch (error) {
        return "Modo Offline: No puedo analizar el documento en este momento.";
    }
};

/**
 * Generates a strategic academic advice
 */
export const generateGradeStrategy = async (
    courseName: string, 
    currentGrade: number, 
    targetGrade: number, 
    neededGrade: number,
    remainingWeight: number,
    modelType: 'flash' | 'pro' = 'flash'
): Promise<string> => {
    try {
        const modelName = MODEL_MAP[modelType];
        const prompt = `Materia: ${courseName}. Nota Actual: ${currentGrade.toFixed(2)}. Meta: ${targetGrade.toFixed(1)}. Necesita: ${neededGrade.toFixed(2)} en el ${remainingWeight}% restante. Dame 3 consejos tácticos breves en Markdown.`;

        const response = await withKeyRotation<GenerateContentResponse>(async (ai) => {
            return await ai.models.generateContent({
                model: modelName, 
                contents: prompt,
                config: { temperature: 0.4 }
            });
        });

        return response.text || "Estrategia no generada.";
    } catch (error) {
        return MOCK_RESPONSES.strategy;
    }
};

/**
 * Researches a specific university
 */
export const researchUniversity = async (university: string, query: string): Promise<{ text: string, foundDates?: { text: string, date: string }[] }> => {
    try {
        const model = 'gemini-3-flash-preview'; 
        const prompt = `Investiga sobre: ${university}. Consulta: "${query}".
        Si encuentras fechas específicas, extraelas al final en formato JSON puro:
        \`\`\`json
        [{"text": "Evento", "date": "YYYY-MM-DD"}]
        \`\`\`
        Prioriza información oficial.`;

        const response = await withKeyRotation<GenerateContentResponse>(async (ai) => {
            return await ai.models.generateContent({
                model: model, 
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    temperature: 0.5
                }
            });
        }); 

        const fullText = response.text || "Sin datos.";
        
        const jsonMatch = fullText.match(/```json([\s\S]*?)```/);
        let foundDates = undefined;
        let cleanText = fullText;

        if (jsonMatch && jsonMatch[1]) {
            try {
                foundDates = JSON.parse(jsonMatch[1]);
                cleanText = fullText.replace(jsonMatch[0], '').trim();
            } catch (e) { console.error(e); }
        }

        return { text: cleanText, foundDates };

    } catch (error) {
        console.warn("Research Error -> Using Mock");
        return { 
            text: MOCK_RESPONSES.university,
            foundDates: []
        };
    }
};
