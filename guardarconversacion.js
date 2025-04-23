const fs = require('fs/promises');
const path = require('path');
const ExcelJS = require('exceljs');

/**
 * Guarda el mensaje en un archivo de texto.
 * @param {string} numero El número de teléfono del usuario.
 * @param {object} mensaje El mensaje que se va a guardar.
 * @param {string} tempDir El directorio temporal donde se guarda el archivo de texto.
 */
async function guardarTexto(numero, mensaje, tempDir) {
  if (!numero || !mensaje || !tempDir) {
    console.error('❌ Parámetros inválidos para guardar texto');
    return;
  }

  const fecha = new Date().toLocaleString();
  const tipo = mensaje.from ? 'RECIBIDO' : 'ENVIADO';
  const linea = `[${fecha}] [${tipo}]: ${mensaje.body || 'Multimedia'}\n`;

  try {
    // Asegurarse de que el directorio exista
    await fs.mkdir(tempDir, { recursive: true });

    // Guardar el mensaje en el archivo
    const archivo = path.join(tempDir, `${numero}.txt`);
    await fs.appendFile(archivo, linea);
    console.log(`✅ Mensaje guardado en: ${archivo}`);
  } catch (err) {
    console.error('❌ Error guardando texto:', err);
  }
}

/**
 * Guarda el mensaje en un archivo de Excel.
 * @param {string} numero El número de teléfono del usuario.
 * @param {object} mensaje El mensaje que se va a guardar.
 * @param {string} excelDir El directorio donde se guarda el archivo de Excel.
 */
async function guardarExcel(numero, mensaje, excelDir) {
  if (!numero || !mensaje || !excelDir) {
    console.error('❌ Parámetros inválidos para guardar en Excel');
    return;
  }

  const archivo = path.join(excelDir, `${numero}.xlsx`);
  let wb;

  try {
    // Asegurarse de que el directorio exista
    await fs.mkdir(excelDir, { recursive: true });

    // Si el archivo existe, leerlo; de lo contrario, crear uno nuevo
    wb = await fs.existsSync(archivo)
      ? await new ExcelJS.Workbook().xlsx.readFile(archivo)
      : new ExcelJS.Workbook();
  } catch (err) {
    console.error('❌ Error abriendo el archivo Excel:', err);
    return;
  }

  const ws = wb.getWorksheet('Mensajes') || wb.addWorksheet('Mensajes');
  if (!ws.getRow(1).getCell(1).value) {
    ws.columns = [
      { header: 'Fecha', key: 'fecha', width: 25 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Mensaje', key: 'mensaje', width: 80 },
    ];
  }

  // Agregar una nueva fila al archivo Excel
  ws.addRow({
    fecha: new Date().toLocaleString(),
    tipo: mensaje.from ? 'RECIBIDO' : 'ENVIADO',
    mensaje: mensaje.body || 'Multimedia',
  });

  try {
    // Escribir el archivo Excel
    await wb.xlsx.writeFile(archivo);
    console.log(`✅ Mensaje guardado en Excel: ${archivo}`);
  } catch (err) {
    console.error('❌ Error guardando archivo Excel:', err);
  }
}

module.exports = { guardarTexto, guardarExcel };
