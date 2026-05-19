// Client-side helpers for Gemini AI
// These call the server-side proxy which handles the actual GEMINI_API_KEY for security.
// However, the history shows it exists and was being used.

export const safeFetch = async (url: string, options: RequestInit, retries: number = 3, delay: number = 2000): Promise<any> => {
    try {
        const response = await fetch(url, options);
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        const data = isJson ? await response.json() : null;

        if (!response.ok) {
            const shouldRetry = [500, 502, 503, 504, 429].includes(response.status);
            if (shouldRetry && retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return safeFetch(url, options, retries - 1, delay * 1.5);
            }
            throw new Error(data?.error || `Request failed with status ${response.status}`);
        }

        if (!isJson && response.status !== 204) {
             throw new Error('Server did not return JSON');
        }

        return data;
    } catch (error: any) {
        if (retries > 0 && (error.name === 'TypeError' || error.message.includes('fetch'))) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return safeFetch(url, options, retries - 1, delay * 1.5);
        }
        throw error;
    }
};

export const generateChatResponse = async (messages: { role: 'user' | 'model', content: string }[], systemInstruction: string = 'Anda adalah IPS Maestro Chatbot.') => {
    return safeFetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            prompt: messages[messages.length - 1].content,
            systemInstruction 
        })
    }).then(data => data.text);
};

export const generateLKPD = async (topic: string, grade: string, type: string) => {
    const prompt = `Buatkan LKPD untuk SMP Kelas ${grade} dengan topik ${topic} dan tipe ${type}.`;
    return safeFetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    }).then(data => data.text);
};
