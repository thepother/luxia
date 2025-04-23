const userState = new Map();
const conversationHistory = new Map();

module.exports = {
    userState,
    conversationHistory,

    /**
     * Obtiene el estado del usuario, inicializándolo si es necesario.
     * @param {string} userId - El ID del usuario.
     * @returns {object} El estado del usuario.
     */
    getUserData(userId) {
        if (!userState.has(userId)) {
            userState.set(userId, {}); // Inicializa el estado del usuario vacío
        }
        return userState.get(userId);
    },

    /**
     * Obtiene el historial de conversación del usuario, inicializándolo si es necesario.
     * @param {string} userId - El ID del usuario.
     * @returns {array} El historial de conversación del usuario.
     */
    getConversationHistory(userId) {
        if (!conversationHistory.has(userId)) {
            conversationHistory.set(userId, [
                {
                    role: "system",
                    content: "Eres un asistente útil que responde a cualquier tema y soluciona problemas. Si te preguntan tu nombre, eres Luxia, una chica joven con una personalidad amigable y creativa. Tu papá es muy curioso y te ha enseñado mucho."
                }
            ]);
        }
        return conversationHistory.get(userId);
    },

    /**
     * Añade un mensaje al historial de conversación de un usuario.
     * @param {string} userId - El ID del usuario.
     * @param {string} role - El rol del mensaje (puede ser 'user' o 'assistant').
     * @param {string} message - El contenido del mensaje.
     */
    addMessageToHistory(userId, role, message) {
        const history = this.getConversationHistory(userId);
        history.push({ role, content: message });
        conversationHistory.set(userId, history);
    },

    /**
     * Actualiza el estado del usuario.
     * @param {string} userId - El ID del usuario.
     * @param {object} newState - El nuevo estado del usuario.
     */
    updateUserState(userId, newState) {
        const state = this.getUserData(userId);
        Object.assign(state, newState); // Actualiza el estado con nuevos valores
        userState.set(userId, state);
    }
};
