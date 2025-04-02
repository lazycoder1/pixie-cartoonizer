
import { retryOperation } from "./utils.ts";

// Convert image to appropriate format with fallback mechanism
async function prepareImageForProcessing(imageBlob: Blob): Promise<Blob> {
  console.log("Preparing image for processing...");
  
  try {
    // First attempt: Try to use the image as-is
    console.log("Using original image format");
    return imageBlob;
  } catch (error) {
    console.log("Fallback: Converting image format using base64 approach");
    
    try {
      // Fallback approach: Convert using base64
      const arrayBuffer = await imageBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Create a new blob with PNG format (which is RGBA)
      const base64Image = btoa(String.fromCharCode(...uint8Array));
      const dataUrl = `data:image/png;base64,${base64Image}`;
      
      return await fetch(dataUrl).then(res => {
        if (!res.ok) {
          throw new Error(`Fallback conversion failed: ${res.statusText}`);
        }
        return res.blob();
      });
    } catch (fallbackError) {
      console.error("Image conversion fallback failed:", fallbackError);
      throw new Error(`Image format conversion failed after fallback attempt: ${fallbackError.message}`);
    }
  }
}

// Get image mime type
function getImageMimeType(imageBlob: Blob): string {
  return imageBlob.type || 'image/png'; // Default to PNG if type is not available
}

// Process the image using OpenAI's API
export async function processImage(imageUrl: string, prompt: string, openAIApiKey: string): Promise<string> {
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
      console.log("Image prepared successfully for OpenAI API");
    } catch (conversionError) {
      console.error("Image preparation failed:", conversionError);
      throw new Error(`Failed to prepare image: ${conversionError.message}`);
    }
    
    // Create form data for OpenAI API
    console.log("Creating form data for OpenAI API request...");
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.png');
    formData.append('prompt', prompt);
    formData.append('n', '1');
    formData.append('size', '1024x1024');
    
    // Call OpenAI API to create image edits with retry
    console.log("Sending request to OpenAI API...");
    const openAIResponse = await retryOperation(async () => {
      try {
        const response = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
          },
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: "Could not parse error response" } }));
          const statusCode = response.status;
          const errorMessage = errorData.error?.message || response.statusText;
          throw new Error(`OpenAI API error (${statusCode}): ${errorMessage}`);
        }
        
        return response.json();
      } catch (fetchError) {
        console.error("OpenAI API request failed:", fetchError);
        throw fetchError;
      }
    });
    
    console.log("OpenAI API response received successfully");
    
    if (!openAIResponse?.data?.length || !openAIResponse.data[0].url) {
      console.error("OpenAI response missing expected data structure:", JSON.stringify(openAIResponse));
      throw new Error("Invalid response format from OpenAI API");
    }
    
    console.log("Image processing completed successfully");
    return openAIResponse.data[0].url;
  } catch (error) {
    console.error("Image processing failed:", error);
    throw error;
  }
}
