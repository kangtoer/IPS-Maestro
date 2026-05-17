// Client-side helpers for Gemini AI
// These call the server-side proxy which handles the actual GEMINI_API_KEY for security.
// However, the history shows it exists and was being used.

export const generateChatResponse = async (messages: { role: 'user' | 'model', content: string }[], systemInstruction: string = 'Anda adalah IPS Maestro Chatbot.') => {
    try {
        const response = await fetch('/api/generate-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: messages[messages.length - 1].content,
                systemInstruction 
            })
        });
        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Gemini error:', error);
        throw error;
    }
};

export const generateLKPD = async (topic: string, grade: string, type: string) => {
    const prompt = `Buatkan LKPD untuk SMP Kelas ${grade} dengan topik ${topic} dan tipe ${type}.`; // simplified for helper
    try {
        const response = await fetch('/api/generate-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('LKPD generation error:', error);
        throw error;
    }
};
