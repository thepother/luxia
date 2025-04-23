const { addKeyword } = require('@bot-whatsapp/bot');
const { queryOpenRouter } = require('../services/openrouter-service');

const flowIniciarIA = addKeyword(['consulta', 'pregunta', 'ayuda', 'ia', 'asistente'])
    .addAnswer(
        ['🤖 IA-activado.',
         '.',
         'escribe *"salir"* en cualquier momento.'],
        { capture: true },
        async (ctx, { flowDynamic, fallBack }) => {
            const mensaje = ctx.body.toLowerCase().trim();

            if (mensaje === 'salir') {
                await flowDynamic([
                    '👋 Has salido del modo asistente IA.',
                    'Escribe *"hola"* para volver al menú principal.'
                ]);
                return;
            }

            try {
                await flowDynamic(['💬']);

                const respuesta = await queryOpenRouter(ctx.from, ctx.body);

                await flowDynamic([`🤖 ${respuesta}`]);
            } catch (error) {
                console.error('Error al consultar IA:', error);
                await flowDynamic(['❌ Ocurrió un error al procesar tu solicitud. Intenta nuevamente más tarde.']);
            }

            // Volver a capturar en este flujo para mantener la conversación
            return fallBack();
        }
    );

module.exports = flowIniciarIA;
