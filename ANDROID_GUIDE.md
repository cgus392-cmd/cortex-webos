# 🤖 Guía de Instalación Android

Sigue estos pasos estrictamente en la **Terminal** de VS Code.

## 1. Instalar dependencias
Esto descarga "internet" a tu carpeta local (creará una carpeta `node_modules`).
```bash
npm install
```

## 2. Construir la Web
Esto convierte tu código React en archivos listos para el celular (creará una carpeta `dist`).
```bash
npm run build
```

## 3. Crear el Proyecto Android
Esto crea la carpeta nativa de Android Studio.
```bash
npx cap add android
```

## 4. Sincronizar
Este comando copia tu carpeta `dist` dentro del proyecto Android. Úsalo cada vez que hagas cambios en el código.
```bash
npx cap sync
```

## 5. Abrir Android Studio
Esto lanzará el programa Android Studio automáticamente con tu proyecto cargado.
```bash
npx cap open android
```

---
**Una vez en Android Studio:**
1. Espera a que la barra inferior termine de cargar (Gradle Sync).
2. Conecta tu celular por USB o crea un Emulador.
3. Presiona el botón ▶️ (Play) verde en la barra superior.
