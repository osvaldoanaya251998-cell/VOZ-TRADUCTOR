# VOZ-TRADUCTOR — VozBridge independiente

Aplicación React + Vite + servidor Node.js/Express. **No usa Floot para ejecutar la app**.

## Requisitos
- Node.js 20 o superior
- Clave propia de OpenAI API (el uso de IA se factura según la plataforma)

## Instalar
```bash
git clone https://github.com/osvaldoanaya251998-cell/VOZ-TRADUCTOR.git
cd VOZ-TRADUCTOR
npm install
cp .env.example .env
```
Edita `.env` y configura `OPENAI_API_KEY`. **Nunca subas esa clave a GitHub.**

## Desarrollo
```bash
npm run dev
```
Abre http://localhost:5173. El frontend utiliza Vite y las solicitudes `/_api/*` van al servidor local en el puerto 3001.

## Producción
```bash
npm run build
npm start
```
Sirve la web en el puerto indicado por `PORT` (predeterminado 3001). Despliega frontend y backend juntos en un hosting Node.js; GitHub Pages por sí solo no ejecuta el backend.

## Características
- Interpretación por voz español ↔ otro idioma, por intervalos con detección de pausa.
- Chat conversacional y traducción bajo petición.
- Fotografías: traducción de texto y ayuda con ejercicios.
- Voz mediante síntesis del navegador.
- Branding InsurTalent y modo claro/nocturno.

## Modelos utilizados
- Chat y visión: configurable con `OPENAI_MODEL` (por defecto `gpt-4.1-mini`).
- Transcripción: `whisper-1`.
- Requiere conexión a Internet.

## Seguridad y limitaciones
- El código contiene una limitación básica de solicitudes por IP, pero **no tiene autenticación**; implementa controles adicionales antes de abrir la app al público para proteger gastos de API.
- No guarda conversaciones en base de datos.
- El reconocimiento/transcripción no garantiza traducción simultánea; se procesa por turnos.
- La calidad de voces depende del navegador.
- **No uses la clave API en variables `VITE_*`** ni en componentes React.
- Revisa que los PNG de `public/_cdn/static` estén incluidos; forman parte de la imagen de marca.

## Origen
Migración independiente del código de VozBridge desarrollado previamente en Floot. Repositorio TALENT no se modifica.

## Publicar en un hosting Node.js

Usa un servicio con soporte de procesos Node.js (por ejemplo, Render, Railway o un VPS). Configura como comando de construcción `npm install && npm run build` y como comando de inicio `npm start`. Añade la variable `OPENAI_API_KEY` en los secretos del hosting y establece `PORT` si el proveedor lo exige. El frontend y las APIs se sirven desde el mismo dominio. No funciona como sitio estático puro en GitHub Pages.
