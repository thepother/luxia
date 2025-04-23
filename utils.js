const { downloadMediaMessage } = require('@adiwajshing/baileys');
const fs = require('node:fs/promises');
const path = require('path');
const { convertOggMp3 } = require('./services/convert');
const { voiceToText } = require('./services/whisper');

const handlerAI = async (ctx) => {
  const tmpDir = path.join(process.cwd(), 'tmp');
  const timestamp = Date.now();
  const pathTmpOgg = path.join(tmpDir, `voice-note-${timestamp}.ogg`);
  const pathTmpMp3 = path.join(tmpDir, `voice-note-${timestamp}.mp3`);

  try {
    const buffer = await downloadMediaMessage(ctx, "buffer");
    if (!buffer) throw new Error('Buffer vacío al descargar el audio');

    await fs.writeFile(pathTmpOgg, buffer);
    await convertOggMp3(pathTmpOgg, pathTmpMp3);
    const text = await voiceToText(pathTmpMp3);
    return text;
  } catch (err) {
    console.error('❌ Error en handlerAI:', err);
    return 'No pude entender el audio 😓';
  } finally {
    // Limpieza de archivos temporales
    try {
      await fs.unlink(pathTmpOgg);
      await fs.unlink(pathTmpMp3);
    } catch (cleanupErr) {
      console.warn('⚠️ Limpieza fallida:', cleanupErr);
    }
  }
};

module.exports = { handlerAI };
