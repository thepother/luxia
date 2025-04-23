const fs = require('fs/promises');
const path = require('path');
const { voiceToText } = require('./services/whisper');
const { downloadMediaMessage } = require('@bot-whatsapp/bot');
const { convertOggToMp3 } = require('./utils/audio');

/**
 * Maneja la transcripción de audios recibidos en el mensaje.
 * @param {object} ctx - El contexto del mensaje recibido.
 * @returns {string} - El texto transcrito o un mensaje de error.
 */
const handlerAI = async (ctx) => {
    const fileName = `voice-note-${Date.now()}`;
    const tmpDir = path.join(process.cwd(), 'temp');
    const pathTmpOgg = path.join(tmpDir, `${fileName}.ogg`);
    const pathTmpMp3 = path.join(tmpDir, `${fileName}.mp3`);

    try {
        // Descargar audio en buffer
        const buffer = await downloadMediaMessage(ctx, 'buffer');
        if (!buffer) throw new Error('Buffer vacío al descargar el audio.');

        // Guardar el archivo OGG temporalmente
        await fs.writeFile(pathTmpOgg, buffer);

        // Convertir OGG a MP3
        await convertOggToMp3(pathTmpOgg, pathTmpMp3);

        // Transcripción con Whisper
        const text = await voiceToText(pathTmpMp3);
        return text;

    } catch (error) {
        console.error('❌ Error en handlerAI:', error);
        return 'No pude entender el audio 😔';
    } finally {
        // Limpieza de archivos temporales
        try {
            await fs.unlink(pathTmpOgg);
            await fs.unlink(pathTmpMp3);
        } catch (cleanupErr) {
            console.warn('⚠️ No se pudo eliminar algún archivo temporal:', cleanupErr);
        }
    }
};

module.exports = { handlerAI };
