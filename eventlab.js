const fs = require('fs');
const path = require('path');

/**
 * Convierte texto a voz usando la API de Eleven Labs y guarda el archivo de audio.
 * @param {string} text El texto que se convertirá a voz
 * @param {string} [voiceId='vwfl76D5KBjKuSGfTbLB'] El ID de la voz a usar (predeterminado: 'vwfl76D5KBjKuSGfTbLB')
 * @returns {string} La ruta al archivo de audio generado
 */
const textToVoice = async (text, voiceId = 'vwfl76D5KBjKuSGfTbLB') => {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('❌ El texto proporcionado no es válido.');
  }

  const EVENT_TOKEN = process.env.EVENT_TOKEN ?? "";
  if (!EVENT_TOKEN) {
    throw new Error('❌ La clave de API (EVENT_TOKEN) no está configurada.');
  }

  const URL = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  
  const header = new Headers();
  header.append("accept", "audio/mpeg");
  header.append("xi-api-key", EVENT_TOKEN);
  header.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    text,
    model_id: "eleven_multilingual_v1",
    voice_settings: {
      stability: 1,
      similarity_boost: 0.8,
    },
  });

  const requestOptions = {
    method: "POST",
    headers: header,
    body: raw,
    redirect: "follow",
  };

  try {
    // Realizar la solicitud a la API de Eleven Labs
    const response = await fetch(URL, requestOptions);
    if (!response.ok) {
      throw new Error(`❌ Error en la respuesta de la API: ${response.statusText}`);
    }

    // Obtener el buffer de audio y guardarlo en un archivo
    const buffer = await response.arrayBuffer();
    
    const tmpDir = path.join(process.cwd(), 'tmp');
    // Verificar que el directorio existe
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const pathFile = path.join(tmpDir, `${Date.now()}-audio.mp3`);
    fs.writeFileSync(pathFile, Buffer.from(buffer));

    console.log(`✅ Archivo de audio guardado en: ${pathFile}`);
    return pathFile;

  } catch (error) {
    console.error('❌ Error al procesar texto a voz:', error.message);
    throw new Error('❌ Hubo un error al convertir el texto a voz.');
  }
};

module.exports = { textToVoice };
