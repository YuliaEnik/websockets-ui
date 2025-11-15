export const createWebSocketMessage = (type, data) => ({
    type,
    data,
    id: 0
});

export const createRegistrationResponse = (name, index, error = false, errorText = '') => ({
    name,
    index,
    error,
    errorText
});
