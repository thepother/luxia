require('dotenv').config();
const path = require('path');
const fs = require('fs/promises');
const ExcelJS = require('exceljs');
const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
const { init } = require('bot-ws-plugin-openai');
const { handlerAI } = require('./utils');
const { textToVoice } = require('./services/eventlab');
const { downloadAndSaveMedia } = require('./services/downloadAndSaveMedia');

// Flujos personalizados
const flowPrincipal = require('./flows/flow-principal');
const flowHorarios = require('./flows/flow-horarios');
const flowUbicacion = require('./flows/flow-ubicacion');
const flowIniciarIA = require('./flows/flow-ia');
const { flowAudio, flowActivarAudio } = require('./flows/flow-audio');
const { flowCita, flowModificarCita, flowCancelarCita } = require('./flows/flow-cita');

// Configuraciones de plugins de OpenAI
const employeesAddonConfig = {
  model: 'gpt-4-0613',
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
};

const employeesAddon = init(employeesAddonConfig);

// Flujo del staff de turismo
const flowStaff = addKeyword(EVENTS.ACTION).addAnswer(
  ["Claro que te interesa?", "mejor te envio audio.."],
  null,
  async (_, { flowDynamic, state }) => {
    console.log("🙉 texto a voz....");
    const currentState = state.getMyState();
    const path = await textToVoice(currentState.answer);
    console.log(`🙉 Fin texto a voz....[PATH]:${path}`);
    await flowDynamic([{ body: "escucha", media: path }]);
  }
);

// Flujos con inteligencia y audio
const flowVentas = addKeyword(['pedir', 'ordenar']).addAnswer(
  ['¿Claro que te interesa?', 'Mejor te envío un audio...'],
  null,
  async (_, { flowDynamic }) => {
    const path = await textToVoice(
      '¡Hola! Claro, dime cómo te puedo ayudar. Si gustas, envíame los detalles técnicos que necesitas.'
    );
    await flowDynamic([{ body: 'Escucha esto:', media: path }]);
  }
);

const flowSoporte = addKeyword(['necesito ayuda']).addAnswer(
  'Claro, ¿cómo te puedo ayudar?'
);

// Combinando los manejadores de notas de voz
const flowVoiceNote = addKeyword(EVENTS.VOICE_NOTE).addAction(
  async (ctx, ctxFn) => {
    await ctxFn.flowDynamic('Dame un momento para escucharte... 🙉');
    console.log("🤖 voz a texto....");
    const texto = await handlerAI(ctx);
    console.log(`🤖 Fin voz a texto....[TEXT]: ${texto}`);
    
    const currentState = ctxFn.state.getMyState();
    const fullSentence = `${currentState?.answer ?? ""}. ${texto}`;
    const { employee, answer } = await employeesAddon.determine(fullSentence);
    ctxFn.state.update({ answer });
    
    employeesAddon.gotoFlow(employee, ctxFn);
  }
);

// Configurar todos los empleados digitales
employeesAddon.employees([
  {
    name: 'EMPLEADO_VENDEDOR',
    description:
      'Soy Rob, el vendedor amable encargado de atender si tienes intención de comprar. Respondo con 1-3 emojis 🤖 🚀 🤔.',
    flow: flowVentas,
  },
  {
    name: 'EMPLEADO_DEVOLUCIONES',
    description:
      'Soy Steffany, encargada de devoluciones y reembolsos. Mis respuestas son breves.',
    flow: flowSoporte,
  },
  {
    name: "EMPLEADO_STAFF_TOUR",
    description:
      "Soy Jorge el staff amable encargado de atender las solicitudes de los viajeros si tienen dudas, preguntas sobre el tour o la ciudad de Madrid, mis respuestas son breves.",
    flow: flowStaff,
  }
]);

// Crear carpetas temp para guardar multimedia
async function setupDirectorios() {
  const base = path.join(__dirname, 'temp');
  const dirs = {
    tempDir: base,
    audios: path.join(base, 'audios'),
    imagenes: path.join(base, 'imagenes'),
    videos: path.join(base, 'videos'),
    links: path.join(base, 'links'),
    excel: path.join(base, 'excel'),
  };
  // Crear todos los directorios de forma asincrónica
  const dirPromises = Object.values(dirs).map((dir) => fs.mkdir(dir, { recursive: true }));
  await Promise.all(dirPromises);
  return dirs;
}

async function guardarTexto(numero, mensaje, tempDir) {
  const fecha = new Date().toLocaleString();
  const tipo = mensaje.from ? 'RECIBIDO' : 'ENVIADO';
  const linea = `[${fecha}] [${tipo}]: ${mensaje.body || 'Multimedia'}\n`;
  
  try {
    await fs.appendFile(path.join(tempDir, `${numero}.txt`), linea);
  } catch (err) {
    console.error('❌ Error guardando texto:', err);
  }
}

async function guardarExcel(numero, mensaje, excelDir) {
  const archivo = path.join(excelDir, `${numero}.xlsx`);
  let wb;
  try {
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

  ws.addRow({
    fecha: new Date().toLocaleString(),
    tipo: mensaje.from ? 'RECIBIDO' : 'ENVIADO',
    mensaje: mensaje.body || 'Multimedia',
  });

  try {
    await wb.xlsx.writeFile(archivo);
  } catch (err) {
    console.error('❌ Error guardando archivo Excel:', err);
  }
}

async function main() {
  const dirs = await setupDirectorios();

  const adapterFlow = createFlow([
    flowPrincipal, flowHorarios, flowUbicacion, flowIniciarIA,
    flowAudio, flowActivarAudio,
    flowCita, flowModificarCita, flowCancelarCita,
    flowVentas, flowSoporte, flowStaff, flowVoiceNote
  ]);

  const adapterProvider = createProvider(BaileysProvider);
  const adapterDB = new MockAdapter();

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  adapterProvider.on('message', async (msg) => {
    try {
      if (!msg.from) return;  // Verifica que el mensaje tenga el campo "from"
      
      const numero = msg.from.replace('@c.us', '');
      // Llamar a las funciones de guardar texto y Excel
      const { guardarTexto, guardarExcel } = require('./services/guardarconversacion');

      // Descargar y guardar medios si hay
      await downloadAndSaveMedia(msg, adapterProvider, dirs);

    } catch (err) {
      console.error('❌ Error en evento message:', err);
    }
  });

  QRPortalWeb();
}

main();
