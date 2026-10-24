# VOZ-TRADUCTOR — VozBridge Basic (Cloudflare AI)

Proyecto independiente de Floot y de **TALENT**. Conserva la interfaz React, el logotipo InsurTalent, el modo claro/oscuro y los enlaces al portal.

## Versión gratuita para Cloudflare Workers

Esta rama sustituye las llamadas del Worker a la API de pago de OpenAI por modelos alojados en **Cloudflare Workers AI**, usando la asignación gratuita diaria de Cloudflare. **No necesita OPENAI_API_KEY**. La cuota gratuita no es ilimitada: al agotarse, el servidor devuelve un aviso y habrá que esperar al siguiente reinicio diario.

- Traducción de texto: `@cf/meta/m2m100-1.2b`
- Interpretación de voz: `@cf/openai/whisper-large-v3-turbo` alojado en Cloudflare, más un modelo de idioma y traducción.
- Chat de práctica: `@cf/google/gemma-4-26b-a4b-it`.
- Lectura de la traducción: síntesis de voz del navegador.
- Fotografías: **no disponible todavía en Basic** (el endpoint avisa explícitamente).
- Reconocimiento de voz del modo de escucha: API del navegador; depende de compatibilidad y permisos.

**Nota:** aunque uno de los modelos de transcripción tenga `openai` en su identificador, se ejecuta mediante Cloudflare, sin conexión a la facturación de la API de OpenAI.

## Despliegue con Cloudflare

1. Crea/selecciona un Worker vinculado al repositorio `VOZ-TRADUCTOR`.
2. Build command: `npm install && npm run build`
3. Deploy command: `npx wrangler deploy`
4. Verifica que `wrangler.jsonc` incorpora `"ai": { "binding": "AI" }`.
5. Prueba la rama en una vista previa antes de fusionarla con `main`.
6. Después del despliegue, prueba texto español → inglés, inglés → español, interpretación de una frase corta y chat.

`OPENAI_API_KEY` no se usa en el Worker de Cloudflare. Puedes retirar el secreto antiguo cuando compruebes la migración.

## Desarrollo local y servidor legado

El repositorio también incluye un servidor Express de la versión anterior. Los comandos `npm run dev` y `npm start` siguen usando ese servidor legado y **todavía pueden requerir OpenAI**. Para probar la edición gratuita del Worker utiliza Wrangler, con acceso a una cuenta Cloudflare y al binding AI.

```bash
npm install
npm run build
npx wrangler dev
```

La web usa React/Vite y el Worker está en `cloudflare/worker.js`.

## Límites y seguridad

- Cloudflare Workers AI tiene una cuota gratuita diaria, no un número fijo de traducciones.
- No existe autenticación ni limitación de tasa persistente por visitante en esta rama. **No se recomienda abrirla a tráfico masivo** antes de configurar Rate Limiting/Turnstile o un límite de consumo.
- La transcripción se procesa por intervalos; no es interpretación simultánea perfecta.
- Los resultados de idiomas y el reconocimiento de voz deben verificarse con dispositivos reales.
- Nunca subas secretos al repositorio ni modifiques la aplicación TALENT como parte de esta migración.
