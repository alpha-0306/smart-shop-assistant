import * as ImageManipulator from 'expo-image-manipulator';

export interface DetectedProduct {
  name: string;
  estimatedPrice: number;
  estimatedStock: number;
}

/**
 * Convert image URI to base64
 */
async function imageToBase64(uri: string): Promise<string> {
  try {
    // Use ImageManipulator to convert to base64
    // This works with both local and remote URIs
    const manipResult = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });

    if (!manipResult.base64) {
      throw new Error('Failed to convert image to base64');
    }

    return manipResult.base64;
  } catch (error) {
    console.error('Image conversion error:', error);
    throw error;
  }
}

/**
 * Analyze shelf image using Gemini Vision API
 */
export async function analyzeShelfImage(
  imageUri: string,
  apiKey: string
): Promise<DetectedProduct[]> {
  try {
    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);

    // Prepare Gemini API request
    const prompt = `Analyze this image of shop products. List ALL visible products with their details in JSON format.

For each product, provide:
- name: Product name (be specific, include brand if visible)
- estimatedPrice: Estimated price in Indian Rupees (₹)
- estimatedStock: Estimated quantity visible (count items)

Return ONLY a valid JSON array like this:
[
  {"name": "Parle-G Biscuits", "estimatedPrice": 50, "estimatedStock": 10},
  {"name": "Britannia Marie", "estimatedPrice": 45, "estimatedStock": 8}
]

Important:
- Return ONLY the JSON array, no other text
- Include ALL visible products
- Be specific with product names
- Estimate realistic Indian market prices`;

    // Try gemini-pro-vision (stable model for vision tasks)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      
      // Provide helpful error messages
      if (response.status === 400) {
        throw new Error(`Invalid API request: ${errorMessage}. Check your API key and try again.`);
      } else if (response.status === 403) {
        throw new Error(`API key invalid or quota exceeded: ${errorMessage}`);
      } else if (response.status === 404) {
        throw new Error(`Model not found. This might be a temporary issue. Try again in a moment.`);
      } else {
        throw new Error(`Gemini API error (${response.status}): ${errorMessage}`);
      }
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const products: DetectedProduct[] = JSON.parse(jsonMatch[0]);
    return products;
  } catch (error) {
    console.error('Gemini Vision error:', error);
    throw error;
  }
}
