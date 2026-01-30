
# 📱 CORTEX MOBILE: STRATEGIC BLUEPRINT v2.0
> **Objetivo:** Convertir Cortex WebOS en una "Super App" Híbrida.
> **Estrategia:** Monorepo Unificado (Capacitor JS).
> **Promesa:** Cero afectación a la versión Web actual.

---

## 1. 🛡️ Protocolo de Seguridad (Zero-Risk)

Para garantizar que la web siga funcionando perfectamente mientras construimos la App, hemos implementado:

1.  **Aislamiento de Lógica (`platform.ts`):** 
    Cualquier función nativa (vibración, cámara real, notificaciones push) está envuelta en condicionales `if (isNativeApp())`. Si es web, se ignora o usa un fallback seguro.

2.  **UI Adaptativa (`App.tsx`):**
    *   **Desktop/Web:** Muestra el Sidebar lateral (`<aside>`).
    *   **Móvil/App:** Oculta el Sidebar y muestra la `MobileNavBar` inferior.
    *   Esto se maneja con clases CSS (`md:hidden`, `md:flex`), por lo que el navegador lo resuelve nativamente sin Javascript complejo.

3.  **Modo Eco (Rendimiento):**
    *   Para dispositivos móviles o gama baja, el nuevo "Modo Eco" desactiva los efectos de desenfoque (`backdrop-filter`) y las animaciones pesadas, garantizando 60 FPS en la APK.

---

## 2. 🚀 Guía de Instalación (Tu Próximo Paso)

Para activar el modo móvil, solo necesitas ejecutar estos comandos en tu terminal. **No romperán nada**.

### Paso 1: Instalar el Núcleo
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Cortex WebOS" com.cortex.app --web-dir=dist
```

### Paso 2: Generar la App Android
```bash
# 1. Construir la versión web optimizada
npm run build

# 2. Agregar la plataforma Android
npx cap add android

# 3. Abrir Android Studio (para generar la APK)
npx cap open android
```

---

## 3. 🧩 Adaptaciones Realizadas

Ya hemos inyectado los componentes necesarios en el código:

*   **`components/MobileNavBar.tsx`**: Una barra de navegación inferior diseñada para pulgares. Ya está integrada en `App.tsx` pero solo se muestra en pantallas pequeñas.
*   **`services/platform.ts`**: El cerebro que distingue entre web y app.

### Siguientes Pasos (Roadmap)

1.  **Haptics (Vibración):**
    *   Instalar: `npm install @capacitor/haptics`
    *   Integrar en `Cronos.tsx`: Al completar tarea -> `Haptics.impact()`.

2.  **Notificaciones Locales (Cronos):**
    *   Esto permite que la app te avise de tareas *sin internet*.
    *   Instalar: `npm install @capacitor/local-notifications`
    *   **Snippet de Integración (para el futuro):**
    ```typescript
    import { LocalNotifications } from '@capacitor/local-notifications';

    // Al crear una tarea en Cronos:
    if (isNativeApp()) {
       await LocalNotifications.schedule({
         notifications: [
           {
             title: "Recordatorio Cortex",
             body: "Tienes una tarea pendiente: " + newTask.text,
             id: newTask.id,
             schedule: { at: new Date(newTask.date) }, // Fecha programada
             sound: null,
             attachments: null,
             actionTypeId: "",
             extra: null
           }
         ]
       });
    }
    ```

3.  **Cámara Nativa:**
    *   Instalar: `npm install @capacitor/camera`
    *   Integrar en Chat IA: Tomar foto del cuaderno.

---

## 4. 🤖 Prompt para Continuar

Cuando estés listo para configurar las notificaciones o la cámara, usa este prompt con tu IA:

```text
Estoy trabajando en Cortex WebOS (Modo Híbrido con Capacitor).
Ya tengo la estructura base y la detección de plataforma.
Quiero implementar [NOMBRE DEL PLUGIN, EJ: HAPTICS].
1. Dame el comando de instalación npm.
2. Dame el código para `services/platform.ts` que envuelva esta función de forma segura para que no rompa la web.
3. Dime dónde invocarlo en la UI.
```
