# VOZ-TRADUCTOR — VozBridge Basic sin servidor de IA

Versión básica **sin Cloudflare AI, sin OpenAI API y sin cobros por solicitud**. Mantiene la interfaz de InsurTalent, logotipos, temas y enlaces de navegación. TALENT es otro repositorio y no se modifica.

## ¿Qué funciona?

- Traducción de frases dentro del navegador mediante la API integrada `Translator`.
- Reconocimiento de voz con la Web Speech API del navegador, si está disponible.
- Reproducción de traducciones con `speechSynthesis`.
- Conversación por turnos: el usuario elige cuál de las dos personas habla.
- La segunda pantalla se transforma en traductor básico de frases; **ya no es un chat generativo**.
- Traducción de fotografías: **no disponible** en esta variante.

**Importante:** La traducción local integrada funciona solo en determinados navegadores y dispositivos (principalmente Chrome de escritorio). En móviles y navegadores no compatibles se mostrará un error de disponibilidad. Los modelos de idiomas pueden descargarse la primera vez. El reconocimiento de voz, a diferencia de la traducción, puede ser procesado en servidores del proveedor del navegador, según la implementación. Esto no es una solución completamente offline.

## Sin servidor de IA de pago

Las pantallas de esta variante no hacen llamadas a `/_api/translate`, `/_api/interpret` ni `/_api/practice`. Los archivos `server/` y `cloudflare/` permanecen en el repositorio por compatibilidad histórica, pero **no se despliegan** al utilizar GitHub Pages. No uses los comandos de arranque del servidor legado si buscas la modalidad gratuita.

## Compilar como sitio estático

```bash
npm install
npm run build
```

El directorio `dist/` se puede alojar en cualquier servicio estático compatible. Las rutas utilizan `HashRouter` y los archivos estáticos usan rutas relativas.

## Publicar gratis con GitHub Pages

1. Fusionar la rama de prueba cuando la compilación y los ensayos de traducción hayan pasado.
2. En el repositorio de GitHub, abrir **Settings → Pages**, seleccionar **GitHub Actions** como fuente.
3. Abrir **Actions → Publicar VozBridge Basic en GitHub Pages → Run workflow**.
4. La URL prevista para este nombre de repositorio es `https://osvaldoanaya251998-cell.github.io/VOZ-TRADUCTOR/`, una vez publicado.

El flujo de publicación es **manual**: no se ejecuta al guardar cambios, para evitar despliegues accidentales.

## Pruebas necesarias

- Chrome de escritorio actualizado en HTTPS.
- Traducción de una frase de español a inglés y viceversa.
- Permiso de micrófono, traducción de un turno y reproducción.
- Mostrar aviso claro en navegadores sin `Translator`.
- Confirmar que en el navegador no se invoca ningún endpoint `/_api/*`.

No se modifica el repositorio TALENT ni se elimina su enlace existente.
