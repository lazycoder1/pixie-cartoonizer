
import { retryOperation } from "./utils.ts";

// Convert image to appropriate format with fallback mechanism
async function prepareImageForProcessing(imageBlob: Blob): Promise<Blob> {
  console.log("Preparing image for processing...");

  try {
    // Create an image element to load the blob
    const img = new Image();
    const imgUrl = URL.createObjectURL(imageBlob);

    // Wait for the image to load
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imgUrl;
    });

    // Create a canvas with the same dimensions
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    // Get the 2D context and draw the image
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Draw the image to ensure RGBA format
    ctx.drawImage(img, 0, 0);

    // Convert to blob with PNG format (which is RGBA)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png');
    });

    // Clean up
    URL.revokeObjectURL(imgUrl);

    return blob;
  } catch (error) {
    console.error("Image conversion failed:", error);
    throw new Error(`Failed to convert image to RGBA format: ${error.message}`);
  }
}

// Get image mime type
function getImageMimeType(imageBlob: Blob): string {
  return imageBlob.type || 'image/png'; // Default to PNG if type is not available
}

// Convert blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Process the image using OpenAI's API and Gemini
export async function processImage(imageUrl: string, prompt: string, openAIApiKey: string, geminiApiKey: string): Promise<string> {
  console.log("Image processing started");
  console.log(`Processing image with prompt: "${prompt}"`);

  try {
    // Fetch the image as a blob with retry
    console.log("Fetching image from URL...");
    const imageResponse = await retryOperation(async () => {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        const status = response.status;
        const text = await response.text().catch(() => "No response body");
        throw new Error(`Failed to fetch image: Status ${status}, Response: ${text}`);
      }
      return response;
    });

    let imageBlob = await imageResponse.blob();
    console.log(`Image fetched successfully. Size: ${imageBlob.size} bytes, Type: ${getImageMimeType(imageBlob)}`);

    // Prepare image with fallback mechanisms
    try {
      imageBlob = await prepareImageForProcessing(imageBlob);
      console.log("Image prepared successfully for API processing");
    } catch (conversionError) {
      console.error("Image preparation failed:", conversionError);
      throw new Error(`Failed to prepare image: ${conversionError.message}`);
    }

    // Convert image to base64 for GPT-4o analysis
    const base64Image = await blobToBase64(imageBlob);

    // Step 1: Analyze image with GPT-4o
    console.log("Analyzing image with GPT-4o...");
    const gptResponse = await retryOperation(async () => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: "this is a realistic ai generated photo, you are a helper that ensures we dont replicate this photo by accident. to ensure we do not replicate this photo describe the people in this image"
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Could not parse error response" } }));
        throw new Error(`GPT-4o API error: ${errorData.error?.message || response.statusText}`);
      }

      return response.json();
    });

    const imageDescription = gptResponse.choices[0].message.content;
    console.log("Image analysis complete:", imageDescription);

    // Step 2: Generate new image with Gemini 2.0 Flash
    console.log("Generating new image with Gemini 2.0 Flash...");
    const geminiResponse = await retryOperation(async () => {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${geminiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Based on this description: "${imageDescription}", generate a new unique image that is different from the original but maintains the same style and quality. ${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Could not parse error response" } }));
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      return response.json();
    });

    // Extract the image URL from Gemini response
    const generatedImageUrl = geminiResponse.candidates[0].content.parts[0].text;
    console.log("Image generation complete");

    return generatedImageUrl;
  } catch (error) {
    console.error("Image processing failed:", error);
    throw error;
  }
}
