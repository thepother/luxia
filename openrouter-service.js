const axios = require('axios');
const { conversationHistory } = require('../utils/state-manager');

// Función para consultar a OpenRouter con memoria de conversación
async function queryOpenRouter(userId, message) {
    try {
        // Inicializar historial si es la primera vez del usuario
        if (!conversationHistory.has(userId)) {
            conversationHistory.set(userId, [
                {
                    role: "system",
                    content: "Eres un asistente útil y amigable que ayuda a los clientes con sus consultas de estilo de vida y problemas, pero también tienes un tono picante y seductor si te preguntan te llamas Luxia, ya que tu papá es muy curioso."
                }
            ]);
        }

        const history = conversationHistory.get(userId);

        // Agregar nuevo mensaje del usuario al historial
        history.push({ role: "user", content: message });

        // Limitar historial a 20 interacciones (1 system + 9 pares user/assistant)
        const limitedHistory = history.length > 20
            ? [history[0], ...history.slice(history.length - 19)] // Mantener el primer mensaje de system
            : history;

        // Solicitud a OpenRouter
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                messages: limitedHistory,
                model: 'gpt-4-0613'
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'WhatsApp Bot'
                }
            }
        );

        const choices = response.data?.choices;
        if (!choices || !choices[0]?.message?.content) {
            console.error('⚠️ Respuesta inesperada de OpenRouter:', response.data);
            return 'Hubo un problema con la respuesta del asistente.';
        }

        const responseContent = choices[0].message.content;

        // Guardar respuesta en el historial
        history.push({ role: "assistant", content: responseContent });
        conversationHistory.set(userId, history);

        return responseContent;

    } catch (error) {
        // Manejo detallado de errores
        if (error.response) {
            console.error('❌ Error de respuesta OpenRouter:', {
                status: error.response.status,
                data: error.response.data
            });
        } else if (error.request) {
            console.error('❌ Sin respuesta de OpenRouter:', error.request);
        } else {
            console.error('❌ Error al configurar la solicitud a OpenRouter:', error.message);
        }

        return 'Lo siento, tuve un problema al procesar tu mensaje.';
    }
}

module.exports = {
    queryOpenRouter
};
