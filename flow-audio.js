const { addKeyword } = require('@bot-whatsapp/bot');
const { processAudioMessage } = require('../services/audio-service');
const fs = require('fs');
const path = require('path');

// Directorio para almacenar los archivos temporales
const TEMP_DIR = path.join(__dirname, '../temp');

// Asegurar que existe el directorio temporal
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Flujo para manejar mensajes de audio
const flowAudio = addKeyword('__audio_mode')
    .addAction(async (ctx, { flowDynamic, provider }) => {
        // Verificar si hay un archivo de audio
        if (!ctx.message.hasMedia || (ctx.message.type !== 'audio' && ctx.message.type !== 'ptt')) {
            await flowDynamic('Por favor, envíame un archivo de audio o nota de voz.');
            return;
        }

        try {
            await flowDynamic('Estoy procesando tu audio, dame un momento...');
            
            // Descargar el archivo de audio
            const media = await provider.getInstance().downloadMedia(ctx.message);
            
            if (!media) {
                await flowDynamic('No pude descargar el audio, por favor intenta de nuevo.');
                return;
            }
            
            // Guardar el archivo temporalmente
            const audioPath = path.join(TEMP_DIR, `input_${Date.now()}.ogg`);
            fs.writeFileSync(audioPath, media.buffer);
            
            // Procesar el audio
            await flowDynamic('Transcribiendo el audio...');
            const { text, transcription, audioPath: responseAudioPath } = await processAudioMessage(ctx.from, audioPath);
            
            // Enviar transcripción
            await flowDynamic(`📝 Entendí: "${transcription}"`);
            
            // Enviar respuesta como texto
            await flowDynamic(`🤖 Mi respuesta: ${text}`);
            
            // Enviar audio de respuesta
            if (responseAudioPath) {
                await flowDynamic('Enviando respuesta de voz...');
                await provider.getInstance().sendMessage(
                    ctx.from, 
                    { audio: { url: `file://${responseAudioPath}` } },
                    { sendAudioAsVoice: true }
                );
            } else {
                await flowDynamic('Lo siento, no pude generar una respuesta de voz en este momento.');
            }
            
            // Limpiar archivos temporales
            fs.unlinkSync(audioPath);
            // No eliminamos el audio de respuesta aquí, lo manejará la limpieza programada
            
        } catch (error) {
            console.error('Error al procesar mensaje de audio:', error);
            await flowDynamic('Lo siento, ocurrió un error al procesar tu audio. Por favor, intenta de nuevo más tarde.');
        }
    });

// Este flujo adicional captura la keyword específica para activar el modo audio
const flowActivarAudio = addKeyword(['audio', 'mensaje de voz', 'nota de voz'])
    .addAnswer(
        ['Estoy listo para escuchar tus mensajes de voz. Envíame un audio y te responderé.', 
         'También puedes enviarme un audio en cualquier momento y te responderé.']
    );

module.exports = {
    flowAudio,
    flowActivarAudio
};
