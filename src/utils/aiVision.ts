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
 * Analyze shelf image using OpenAI GPT-4o Vision API
 */
export async function analyzeShelfImage(
  imageUri: string,
  apiKey: string
): Promise<DetectedProduct[]> {
  try {
    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);

    // Prepare OpenAI API request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image of shop products. List ALL the prominently visible products with their details in JSON format. Avoid any products that are visible just on shelf pictures or advertisements.

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
- Return ONLY the JSON array, no other text or markdown
- Be specific with product names
- Estimate realistic Indian market prices
- Count visible items accurately`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;

      // Provide helpful error messages
      if (response.status === 401) {
        throw new Error(`Invalid API key: ${errorMessage}`);
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${errorMessage}`);
      } else if (response.status === 400) {
        throw new Error(`Invalid request: ${errorMessage}`);
      } else {
        throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
      }
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    // Extract JSON array
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response. AI returned: ' + text.substring(0, 100));
    }

    const products: DetectedProduct[] = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('No products detected in the image');
    }

    return products;
  } catch (error) {
    console.error('AI Vision error:', error);
    throw error;
  }
}
