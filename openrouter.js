require("dotenv").config();
const axios = require("axios");

const chat = async (prompt, messages) => {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("❌ API Key de OpenRouter no encontrada en el archivo .env");
    return "❌ No se encontró la clave API de OpenRouter en el entorno.";
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gpt-4-0613", // Puedes cambiar el modelo aquí
        messages: [
          { role: "system", content: prompt },
          ...messages,
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Verificación de que la respuesta contiene la estructura esperada
    if (!response.data?.choices || response.data.choices.length === 0) {
      console.error("❌ No se recibió una respuesta válida de la API de OpenRouter.");
      return "❌ No se pudo procesar la respuesta de OpenRouter correctamente.";
    }

    const answer = response.data.choices[0]?.message?.content;

    // Verificación adicional en caso de que no haya contenido
    if (!answer) {
      console.error("❌ La respuesta de OpenRouter no contiene el campo 'message.content'.");
      return "❌ La respuesta no contiene contenido válido.";
    }

    return answer;
  } catch (error) {
    // Manejo de errores detallado
    console.error("❌ Error con OpenRouter:", error.response?.data || error.message);
    return "❌ Hubo un error al procesar tu consulta con OpenRouter.";
  }
};

module.exports = { chat };
