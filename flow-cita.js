const { addKeyword } = require('@bot-whatsapp/bot');
const { userState } = require('../utils/state-manager');

// Flujo para confirmar la cita
const flowConfirmarCita = addKeyword(['1', 'si', 'sí', 'confirmar'])
    .addAnswer(
        async (ctx, { flowDynamic }) => {
            const userData = userState.get(ctx.from) || {};
            
            await flowDynamic([
                '✅ ¡Perfecto! Tu cita ha sido confirmada con los siguientes datos:',
                `📋 Nombre: ${userData.nombre}`,
                `📱 Teléfono: ${userData.telefono || 'No proporcionado'}`,
                `🗓️ Fecha: ${userData.fecha}`,
                `⏰ Hora: ${userData.hora}`,
                `💇 Servicio: ${userData.servicio}`,
                '',
                'Te esperamos en nuestra dirección:',
                '📍 Avenida Principal #123, Bogotá',
                '',
                'Si necesitas modificar o cancelar tu cita, escribe *cambiar cita* o *cancelar cita*.'
            ]);
            
            // Aquí podrías implementar la lógica para guardar la cita en una base de datos
        }
    );

// Flujo para rechazar la cita
const flowRechazarCita = addKeyword(['2', 'no', 'cancelar'])
    .addAnswer(
        ['Has cancelado el proceso de reserva de cita.', 
         'Si deseas intentarlo de nuevo, escribe *cita* en cualquier momento.',
         'Si necesitas ayuda con otra cosa, escribe *hola* para volver al menú principal.']
    );

// Flujo para capturar el servicio
const flowServicio = addKeyword(['hora', 'servicio'])
    .addAnswer(
        ['¿Qué servicio deseas agendar?',
         '- Corte de cabello',
         '- Tinte',
         '- Peinado',
         '- Manicure',
         '- Pedicure',
         '- Tratamiento facial',
         '- Otro (especificar)'],
        { capture: true },
        async (ctx, { flowDynamic }) => {
            const userData = userState.get(ctx.from) || {};
            userData.servicio = ctx.body;
            userState.set(ctx.from, userData);
            
            await flowDynamic([
                'Por favor, revisa tus datos:',
                `📋 Nombre: ${userData.nombre}`,
                `📱 Teléfono: ${userData.telefono || 'No proporcionado'}`,
                `🗓️ Fecha: ${userData.fecha}`,
                `⏰ Hora: ${userData.hora}`,
                `💇 Servicio: ${userData.servicio}`,
                '',
                '¿Deseas confirmar esta cita?',
                '1. Sí, confirmar',
                '2. No, cancelar'
            ]);
        },
        [flowConfirmarCita, flowRechazarCita]
    );

// Flujo para capturar la hora
const flowHora = addKeyword(['fecha', 'hora'])
    .addAnswer(
        ['¿A qué hora prefieres tu cita? (formato HH:MM, ejemplo: 14:30)'],
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow }) => {
            const userData = userState.get(ctx.from) || {};
            userData.hora = ctx.body;
            userState.set(ctx.from, userData);
            
            return gotoFlow(flowServicio);
        },
        [flowServicio]
    );

// Flujo para capturar la fecha
const flowFecha = addKeyword(['telefono', 'teléfono', 'fecha'])
    .addAnswer(
        ['¿En qué fecha te gustaría agendar tu cita? (formato DD/MM/YYYY, ejemplo: 30/04/2025)'],
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow }) => {
            const userData = userState.get(ctx.from) || {};
            userData.fecha = ctx.body;
            userState.set(ctx.from, userData);
            
            return gotoFlow(flowHora);
        },
        [flowHora]
    );

// Flujo para capturar el teléfono
const flowTelefono = addKeyword(['nombre', 'telefono', 'teléfono'])
    .addAnswer(
        ['Por favor, proporciona un número de teléfono de contacto:'],
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow }) => {
            const userData = userState.get(ctx.from) || {};
            userData.telefono = ctx.body;
            userState.set(ctx.from, userData);
            
            return gotoFlow(flowFecha);
        },
        [flowFecha]
    );

// Flujo principal para citas
const flowCita = addKeyword(['cita', 'agendar', 'reservar'])
    .addAnswer(
        ['👋 ¡Vamos a agendar tu cita!', '¿Cuál es tu nombre completo?'],
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow }) => {
            // Inicializar o actualizar datos del usuario
            const userData = userState.get(ctx.from) || {};
            userData.nombre = ctx.body;
            userState.set(ctx.from, userData);
            
            return gotoFlow(flowTelefono);
        },
        [flowTelefono]
    );

// Flujo para modificar una cita existente
const flowModificarCita = addKeyword(['modificar cita', 'cambiar cita'])
    .addAnswer(
        ['Para modificar tu cita, por favor contáctanos directamente al teléfono 123-456-7890.',
         'Un asesor te atenderá y realizará los cambios necesarios en tu reserva.']
    );

// Flujo para cancelar una cita existente
const flowCancelarCita = addKeyword(['cancelar cita'])
    .addAnswer(
        ['Para cancelar tu cita, por favor escribe tu nombre completo:'],
        { capture: true },
        async (ctx, { flowDynamic }) => {
            // Aquí podrías implementar la lógica para buscar y cancelar la cita en una base de datos
            
            await flowDynamic([
                `Gracias, ${ctx.body}. Hemos recibido tu solicitud de cancelación.`,
                'Un asesor procesará tu cancelación y te enviaremos una confirmación.',
                'Si tienes alguna duda, contáctanos al teléfono 123-456-7890.'
            ]);
        }
    );

module.exports = {
    flowCita,
    flowModificarCita,
    flowCancelarCita
};