/**
 * Transcribe audio using OpenAI Whisper API and extract amount
 */
export async function transcribeAndExtractAmount(
  audioUri: string,
  apiKey: string
): Promise<number | null> {
  try {
    // Transcribe audio using Whisper
    const transcription = await transcribeAudio(audioUri, apiKey);
    
    // Extract amount from transcription
    const amount = extractAmount(transcription);
    
    return amount;
  } catch (error) {
    console.error('STT error:', error);
    throw error;
  }
}

/**
 * Transcribe audio file using OpenAI Whisper API
 */
async function transcribeAudio(audioUri: string, apiKey: string): Promise<string> {
  try {
    // Create form data
    const formData = new FormData();
    
    // Add audio file
    const audioFile = {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'audio.m4a',
    } as any;
    
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Can also support 'hi' for Hindi

    // Call Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Whisper API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

/**
 * Extract numeric amount from text
 * Handles formats like:
 * - "45 rupees received"
 * - "Received rupees fifty"
 * - "₹50 received"
 * - "Payment of forty five rupees"
 */
export function extractAmount(text: string): number | null {
  const lowerText = text.toLowerCase();

  // Try to find numeric amounts first
  const numericMatches = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:rupees?|rs\.?|₹)?/i);
  if (numericMatches) {
    return parseFloat(numericMatches[1]);
  }

  // Try to find word numbers
  const wordAmount = extractWordNumber(lowerText);
  if (wordAmount !== null) {
    return wordAmount;
  }

  return null;
}

/**
 * Convert word numbers to numeric values
 */
function extractWordNumber(text: string): number | null {
  const wordToNum: { [key: string]: number } = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
    thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
    eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
  };

  // Look for word numbers
  const words = text.split(/\s+/);
  let total = 0;
  let current = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, '');
    const value = wordToNum[cleanWord];

    if (value !== undefined) {
      if (value === 100 || value === 1000) {
        current = current === 0 ? value : current * value;
      } else {
        current += value;
      }
    } else if (current > 0) {
      total += current;
      current = 0;
    }
  }

  total += current;
  return total > 0 ? total : null;
}
