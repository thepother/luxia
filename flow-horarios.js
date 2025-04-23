const { addKeyword } = require('@bot-whatsapp/bot')

// Flujo para mostrar horarios
const flowHorarios = addKeyword(['horarios', 'horario'])
    .addAnswer([
        '🕙 Nuestros horarios de atención son:',
        'Lunes a Viernes: 5:00 AM - 6:00 PM',
        'Sábados: 60:00 AM - 2:00 PM',
        'Domingos: Cerrado'
    ])

module.exports = flowHorarios
