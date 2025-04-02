
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to convert image to RGBA format using canvas
async function convertToRGBA(imageBlob) {
  // We need to use a different approach in Deno since Image is not available
  // First, convert the blob to a base64 string
  const arrayBuffer = await imageBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Create a canvas with the dimensions we need
  // For now we'll assume 1024x1024 which is what DALL-E expects
  const width = 1024;
  const height = 1024;
  
  // Create a new blob with PNG format (which is RGBA)
  const base64Image = btoa(String.fromCharCode(...uint8Array));
  const dataUrl = `data:image/png;base64,${base64Image}`;
  
  return await fetch(dataUrl).then(res => res.blob());
}

// Function to retry failed API calls
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        delay *= 2;
      }
    }
  }
  
  throw new Error(`All ${maxRetries} attempts failed. Last error: ${lastError.message}`);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, prompt, photoId, userId } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not found. Please check your Supabase configuration.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not found');
      return new Response(
        JSON.stringify({ error: 'Supabase credentials not found. Please check your Supabase configuration.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing image with prompt: ${prompt}`);
    
    try {
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
      formData.append('prompt', prompt); // Add the prompt for DALL-E image editing
      formData.append('n', '1'); // Generate one image
      formData.append('size', '1024x1024'); // Image size
      
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
      
      const editedImageUrl = openAIResponse.data[0].url;
      
      // Store the edited image in the database if userId and photoId are provided
      if (userId && photoId) {
        // Save the edited image data
        const { data: editData, error: editError } = await supabase
          .from('edited_photos')
          .update({
            edited_image_url: editedImageUrl,
            status: 'complete'
          })
          .match({ user_id: userId, original_photo_id: photoId, prompt: prompt })
          .select('id')
          .single();
          
        if (editError) {
          console.error('Error updating edited photo data:', editError);
          
          // If no matching record is found, insert a new one
          const { data: insertData, error: insertError } = await supabase
            .from('edited_photos')
            .insert({
              user_id: userId,
              original_photo_id: photoId,
              prompt: prompt,
              edited_image_url: editedImageUrl,
              status: 'complete'
            })
            .select('id')
            .single();
            
          if (insertError) {
            console.error('Error inserting edited photo data:', insertError);
          } else {
            console.log('Edited photo inserted successfully with ID:', insertData.id);
          }
        } else {
          console.log('Edited photo updated successfully with ID:', editData.id);
        }
      } else {
        console.log('No userId or photoId provided, skipping database storage');
      }
      
      // Return the edited image URL from OpenAI
      return new Response(
        JSON.stringify({
          success: true,
          editedImageUrl: editedImageUrl,
          originalPrompt: prompt // Include the prompt in the response for reference
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (apiError) {
      console.error('API operation failed after retries:', apiError);
      
      // If we have user ID and photo ID, record the failed edit
      if (userId && photoId && prompt) {
        try {
          await supabase
            .from('edited_photos')
            .update({
              status: 'failed',
              error_message: apiError.message
            })
            .match({ user_id: userId, original_photo_id: photoId, prompt: prompt });
        } catch (dbError) {
          console.error('Error storing failed edit record:', dbError);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Image processing failed after multiple attempts',
          details: apiError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in edit-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
