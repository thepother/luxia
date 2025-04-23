import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

/**
 * Función para obtener la respuesta del modelo basado en el prompt y los mensajes
 * @param {string} prompt - El mensaje inicial que configura el contexto.
 * @param {Array} messages - Un array de objetos que representan el historial de mensajes.
 * @returns {Promise<string>} - La respuesta generada por el modelo.
 */
export const chat = async (prompt, messages) => {
  try {
    // Realizar la solicitud a la API de OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-0613',
      messages: [
        { role: 'system', content: prompt },
        ...messages
      ]
    });

    // Verificar si la respuesta contiene el contenido esperado
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('La respuesta de la API no contiene contenido válido');
    }

    return content;
  } catch (error) {
    console.error('Error al obtener la respuesta del modelo:', error);
    throw new Error('Hubo un problema al procesar la solicitud. Intenta de nuevo más tarde.');
  }
};
