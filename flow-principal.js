const { addKeyword } = require('@bot-whatsapp/bot')
const { userState } = require('../utils/state-manager')

// Importamos los otros flujos para referenciarlos
const flowHorarios = require('./flow-horarios')
const flowUbicacion = require('./flow-ubicacion')
const flowIniciarIA = require('./flow-ia')
const { flowActivarAudio } = require('./flow-audio')
const { flowCita } = require('./flow-cita')

// Flujo inicial: Saludo y captura del nombre
const flowPrincipal = addKeyword(['hola', 'buenos dias', 'buenas', 'ola', 'hi'])
    .addAnswer(
        ['👋 ¡Hola! Bienvenid@, mi nombre es LuxIA.', '¿Cuál es tu nombre?'],
        { capture: true },
        async (ctx, { flowDynamic }) => {
            const userData = { nombre: ctx.body }
            userState.set(ctx.from, userData)

            await flowDynamic([`Mucho gusto ${ctx.body}. ¿En qué podemos ayudarte hoy en luxCompany?`])
            await flowDynamic([
                'Escribe:',
                '👉 *cita* para agendar una visita',
                '👉 *horarios* para conocer nuestros horarios de atención',
                '👉 *ubicación* para saber cómo llegar',
                '👉 *consulta* para iniciar conversación con nuestro asistente IA',
                '👉 *audio* para activar el modo de mensajes de voz',
                'También puedes enviarme un mensaje de voz directamente y te responderé.'
            ])
        },
        [flowCita, flowHorarios, flowUbicacion, flowIniciarIA, flowActivarAudio]
    )

module.exports = flowPrincipal