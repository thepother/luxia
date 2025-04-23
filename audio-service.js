const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const gTTS = require('node-gtts')('es'); // Español
const { Configuration, OpenAIApi } = require("openai");
const { queryOpenRouter } = require('./openrouter-service');

// Configurar ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Configurar OpenAI para Whisper API
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Directorio para almacenar los archivos temporales
const TEMP_DIR = path.join(__dirname, '../temp');

// Asegurar que existe el directorio temporal
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Convierte un archivo de audio a formato compatible con Whisper
 * @param {string} inputPath - Ruta al archivo de audio original
 * @returns {Promise<string>} - Ruta al archivo convertido
 */
async function convertAudio(inputPath) {
    const outputPath = path.join(TEMP_DIR, `converted_${Date.now()}.wav`);
    
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .output(outputPath)
            .audioFrequency(16000) // Whisper trabaja mejor con audio a 16kHz
            .audioChannels(1)      // Mono
            .audioCodec('pcm_s16le')
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err))
            .run();
    });
}

/**
 * Transcribe un archivo de audio usando Whisper API
 * @param {string} audioPath - Ruta al archivo de audio
 * @returns {Promise<string>} - Texto transcrito
 */
async function transcribeAudio(audioPath) {
    try {
        // Convertir el audio a formato compatible con Whisper
        const convertedPath = await convertAudio(audioPath);
        
        // Usar la API de Whisper para transcribir
        const response = await openai.createTranscription(
            fs.createReadStream(convertedPath),
            "whisper-1",
            undefined, // prompt
            'text',
            0.2, // temperature
            'es' // language
        );
        
        // Limpiar el archivo convertido
        fs.unlinkSync(convertedPath);
        
        return response.data;
    } catch (error) {
        console.error('Error al transcribir audio:', error);
        throw new Error('No se pudo transcribir el audio');
    }
}

/**
 * Convierte texto a audio usando gTTS
 * @param {string} text - Texto a convertir
 * @returns {Promise<string>} - Ruta al archivo de audio generado
 */
async function textToSpeech(text) {
    const audioPath = path.join(TEMP_DIR, `response_${Date.now()}.mp3`);
    
    return new Promise((resolve, reject) => {
        gTTS.save(audioPath, text, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(audioPath);
        });
    });
}

/**
 * Procesa un mensaje de audio y genera una respuesta de audio
 * @param {string} userId - ID del usuario
 * @param {string} audioPath - Ruta al archivo de audio
 * @returns {Promise<{text: string, audioPath: string}>} - Texto y ruta al audio de respuesta
 */
async function processAudioMessage(userId, audioPath) {
    try {
        // Transcribir el audio a texto
        const transcription = await transcribeAudio(audioPath);
        
        // Obtener respuesta del servicio de IA
        const response = await queryOpenRouter(userId, transcription);
        
        // Convertir la respuesta a audio
        const responseAudioPath = await textToSpeech(response);
        
        return {
            text: response,
            transcription,
            audioPath: responseAudioPath
        };
    } catch (error) {
        console.error('Error al procesar mensaje de audio:', error);
        throw error;
    }
}

// Limpiar archivos temporales
function cleanupTempFiles() {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    
    files.forEach(file => {
        const filePath = path.join(TEMP_DIR, file);
        const stats = fs.statSync(filePath);
        
        // Eliminar archivos con más de una hora de antigüedad
        if (now - stats.mtimeMs > ONE_HOUR) {
            fs.unlinkSync(filePath);
        }
    });
}

// Programar limpieza automática cada hora
setInterval(cleanupTempFiles, 60 * 60 * 1000);

module.exports = {
    transcribeAudio,
    textToSpeech,
    processAudioMessage
};
