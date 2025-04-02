
import { retryOperation } from "./utils.ts";

// Helper function to convert image to RGBA format
// Note: This function isn't currently being used but kept for reference
async function convertToRGBA(imageBlob) {
  // We need to use a different approach in Deno since Image is not available
  // First, convert the blob to a base64 string
  const arrayBuffer = await imageBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Create a new blob with PNG format (which is RGBA)
  const base64Image = btoa(String.fromCharCode(...uint8Array));
  const dataUrl = `data:image/png;base64,${base64Image}`;
  
  return await fetch(dataUrl).then(res => res.blob());
}

// Process the image using OpenAI's API
export async function processImage(imageUrl, prompt, openAIApiKey) {
  // Fetch the image as a blob with retry
  const imageResponse = await retryOperation(async () => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    return response;
  });
  
  let imageBlob = await imageResponse.blob();
  
  // Skip the conversion as it's causing issues
  // Just use the blob directly - OpenAI will need to handle it
  console.log("Using image as is without conversion");
  
  // Create form data for OpenAI API
  const formData = new FormData();
  formData.append('image', imageBlob, 'image.png');
  formData.append('prompt', prompt);
  formData.append('n', '1');
  formData.append('size', '1024x1024');
  
  // Call OpenAI API to create image edits with retry
  const openAIResponse = await retryOperation(async () => {
    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }
    
    return response.json();
  });
  
  return openAIResponse.data[0].url;
}
