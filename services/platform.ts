
// Este servicio actúa como un "Sensor de Entorno".
// Permite ejecutar código nativo SOLO si estamos en una App, protegiendo la versión Web.

export const isNativeApp = (): boolean => {
    // Capacitor inyecta un objeto 'Capacitor' en window si está corriendo nativamente
    // @ts-ignore
    return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform();
};

export const getPlatform = (): 'web' | 'ios' | 'android' => {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.Capacitor) {
        // @ts-ignore
        return window.Capacitor.getPlatform();
    }
    return 'web';
};

// Hook híbrido para Haptics (Vibración)
// Funciona en Web (usando navigator.vibrate) y prepara el terreno para Nativo
export const triggerHaptic = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (isNativeApp()) {
        // Aquí iría la llamada a Capacitor Haptics cuando se instale el plugin
        // await Haptics.impact({ style });
        console.log(`📳 Haptic nativo: ${style}`);
    } else {
        // Fallback para Web Móvil (Android soporta esto muy bien, iOS parcialmente)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            switch (style) {
                case 'light': navigator.vibrate(10); break;  // Click sutil
                case 'medium': navigator.vibrate(40); break; // Acción confirmada
                case 'heavy': navigator.vibrate([50, 30, 50]); break; // Error o Alerta
            }
        }
    }
};
