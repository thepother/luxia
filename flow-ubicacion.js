const { addKeyword } = require('@bot-whatsapp/bot')

// Flujo para mostrar ubicación
const flowUbicacion = addKeyword(['ubicacion', 'ubicación'])
    .addAnswer([
        '📍 Nos encontramos en:',
        'Avenida Principal #123',
        'Bogota',
        'colombia',
        'Código Postal 12345',
        'https://maps.app.goo.gl/ZfShzXFQ7KRnDdLY6'
    ])

module.exports = flowUbicacion
