const fs = require('fs/promises');
const path = require('path');

/**
 * Función para descargar y guardar medios
 * @param {*} msg El mensaje con el archivo multimedia
 * @param {*} provider El proveedor que maneja la descarga
 * @param {*} dirs Los directorios donde guardar los archivos
 * @returns {string|null} La ruta del archivo guardado o null si no se pudo guardar
 */
async function downloadAndSaveMedia(msg, provider, dirs) {
  // Verificar si el mensaje contiene medios
  if (!msg.hasMedia) {
    console.log('❌ El mensaje no contiene archivos multimedia');
    return null;
  }

  try {
    // Descargar el archivo multimedia
    const download = await provider.downloadMediaMessage(msg);
    const buffer = download.data || download;
    if (!buffer) {
      throw new Error('❌ El buffer de datos está vacío');
    }

    // Determinar la extensión del archivo
    let ext = 'bin'; // Valor predeterminado si no se puede determinar
    if (msg.mimetype) {
      const parts = msg.mimetype.split('/');
      ext = parts[1] ? parts[1].split(';')[0] : 'bin'; // Asumir el tipo de archivo a partir del mimetype
    }

    // Determinar el directorio adecuado según el tipo de archivo
    let folder = dirs.links; // Por defecto en el directorio de enlaces
    if (msg.mimetype?.startsWith('image/')) folder = dirs.imagenes;
    else if (msg.mimetype?.startsWith('audio/')) folder = dirs.audios;
    else if (msg.mimetype?.startsWith('video/')) folder = dirs.videos;

    // Generar nombre de archivo único usando timestamp
    const filename = `${msg.type}_${Date.now()}.${ext}`;
    const filepath = path.join(folder, filename);

    // Crear el archivo en el directorio correspondiente
    await fs.writeFile(filepath, buffer);
    console.log(`✅ Archivo guardado exitosamente en: ${filepath}`);
    return filepath;

  } catch (err) {
    console.error('❌ Error al guardar el archivo multimedia:', err.message || err);
    return null;
  }
}

module.exports = downloadAndSaveMedia;
