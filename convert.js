const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = "/usr/bin/ffmpeg"; // Asegúrate de que esta ruta es correcta
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Convierte un archivo de audio OGG a MP3
 * @param {string} inputStream - Ruta del archivo de entrada OGG
 * @param {string} outStream - Ruta donde se guardará el archivo MP3
 * @returns {Promise<boolean>}
 */
const convertOggToMp3 = async (inputStream, outStream) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputStream)
      .audioQuality(96)
      .toFormat("mp3")
      .save(outStream)
      .on("end", () => {
        resolve(true);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

module.exports = { convertOggToMp3 };
