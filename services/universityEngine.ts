
// 🧠 CORTEX UNIVERSITY ENGINE v2.1 (Safety First)
// Motor optimizado para FIABILIDAD TOTAL (100% Uptime Logos)

import { findUniversityDomainAI } from "./gemini";

export interface UniversityMatch {
    name: string;
    domain: string;
    country: string;
    logo: string;
}

// Helper para normalizar texto
const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * 🛡️ SAFE LOGO GENERATOR
 * Usamos Google S2. Es infalible. Si el dominio existe, devuelve icono.
 * Si no tiene icono, devuelve un globo terráqueo genérico. NUNCA devuelve 404.
 */
const getSafeLogo = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;

// --- BASE DE DATOS LOCAL (CACHE RÁPIDA) ---
const MASTER_DB = [
    // COLOMBIA
    { n: "Universidad Nacional de Colombia", d: "unal.edu.co", a: ["unal", "nacional", "bogota", "medellin"] },
    { n: "Universidad de los Andes", d: "uniandes.edu.co", a: ["andes", "uniandes"] },
    { n: "Pontificia Universidad Javeriana", d: "javeriana.edu.co", a: ["puj", "javeriana"] },
    { n: "Universidad de Antioquia", d: "udea.edu.co", a: ["udea", "antioquia"] },
    { n: "Universidad del Norte", d: "uninorte.edu.co", a: ["uninorte", "norte"] },
    { n: "Universidad Simón Bolívar", d: "unisimon.edu.co", a: ["unisimon", "simon bolivar", "usb"] },
    { n: "Universidad del Atlántico", d: "uniatlantico.edu.co", a: ["uniatlantico", "atlantico"] },
    { n: "Universidad EAFIT", d: "eafit.edu.co", a: ["eafit"] },
    { n: "Universidad Pontificia Bolivariana", d: "upb.edu.co", a: ["upb", "bolivariana"] },
    { n: "Universidad Industrial de Santander", d: "uis.edu.co", a: ["uis", "santander"] },
    { n: "Universidad del Valle", d: "univalle.edu.co", a: ["univalle", "valle"] },
    { n: "Universidad Tecnológica de Bolívar", d: "utb.edu.co", a: ["utb"] },
    { n: "Universidad de la Costa", d: "cuc.edu.co", a: ["cuc", "costa"] },
    { n: "Universidad Autónoma del Caribe", d: "uac.edu.co", a: ["uac", "autonoma"] },
    // MEXICO
    { n: "UNAM", d: "unam.mx", a: ["nacional", "mexico"] },
    { n: "Tecnológico de Monterrey", d: "tec.mx", a: ["tec", "monterrey"] },
    // GLOBAL
    { n: "Harvard University", d: "harvard.edu", a: ["harvard"] },
    { n: "MIT", d: "mit.edu", a: ["mit"] }
];

/**
 * Busca universidades en DB Local.
 */
export const searchUniversityDatabase = (query: string): UniversityMatch[] => {
    if (!query || query.length < 2) return [];
    
    const cleanQuery = normalize(query);
    
    // 1. Detección directa de URL
    if (cleanQuery.includes('.') && !cleanQuery.includes(' ')) {
        const domain = cleanQuery.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return [{
            name: domain,
            domain: domain,
            country: "Web",
            logo: getSafeLogo(domain)
        }];
    }

    // 2. Búsqueda en DB Local
    const localResults = MASTER_DB.filter(uni => {
        const nameMatch = normalize(uni.n).includes(cleanQuery);
        const aliasMatch = uni.a.some(alias => alias.includes(cleanQuery));
        return nameMatch || aliasMatch;
    }).map(uni => ({
        name: uni.n,
        domain: uni.d,
        country: "Verificada (Local)",
        logo: getSafeLogo(uni.d)
    }));

    return localResults.slice(0, 5);
};

/**
 * Búsqueda IA + Logos Seguros
 */
export const searchUniversityWithAI = async (query: string): Promise<UniversityMatch[]> => {
    const aiResults = await findUniversityDomainAI(query);
    
    return aiResults.map(res => ({
        name: res.name,
        domain: res.domain,
        country: "Búsqueda IA",
        logo: getSafeLogo(res.domain)
    }));
};

/**
 * Obtiene la URL del logo más segura posible.
 */
export const getUniversityLogo = (domain: string): string => {
    return getSafeLogo(domain); 
};
