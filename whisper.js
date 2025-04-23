const fs = require("fs").promises;  // Uso de fs.promises para operaciones asincrónicas
const { Configuration, OpenAIApi } = require("openai");

/**
 * Convierte un archivo de audio en texto utilizando el modelo Whisper de OpenAI.
 * @param {string} path - Ruta del archivo de audio (MP3).
 * @returns {string} - El texto transcrito del audio o un mensaje de error.
 */
const voiceToText = async (path) => {
  try {
    // Verificar si el archivo existe
    await fs.access(path);  // Asíncrono y más eficiente que fs.existsSync

    // Verificar que el archivo sea MP3
    if (!path.endsWith('.mp3')) {
      throw new Error("El archivo debe ser un MP3.");
    }

    // Configuración de OpenAI API
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    // Crear transcripción usando Whisper
    const resp = await openai.createTranscription(
      fs.createReadStream(path),
      "whisper-1"
    );

    return resp.data.text;

  } catch (err) {
    if (err.response) {
      console.error("❌ Error de OpenAI:", err.response.data);
    } else if (err.code === 'ENOENT') {
      console.error("❌ El archivo no existe:", path);
    } else {
      console.error("❌ Error desconocido:", err.message);
    }

    return "ERROR: No se pudo procesar el archivo.";
  }
};

module.exports = { voiceToText };
