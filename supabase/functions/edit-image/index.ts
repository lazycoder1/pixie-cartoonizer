
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, prompt } = await req.json();
    
    if (!imageUrl || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Image URL and prompt are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing image edit with prompt: ${prompt}`);
    
    // Fetch the image as a blob
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    const imageBlob = await imageResponse.blob();
    
    // Create form data for OpenAI API
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.png');
    formData.append('prompt', prompt);
    formData.append('model', 'dall-e-3');
    formData.append('n', '1');
    formData.append('size', '1024x1024');
    
    // Call OpenAI API to edit the image
    const openAIResponse = await fetch('https://api.openai.com/v1/images/variations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });
    
    const openAIData = await openAIResponse.json();
    
    if (openAIResponse.status !== 200) {
      console.error('OpenAI API error:', openAIData);
      throw new Error(`OpenAI API error: ${openAIData.error?.message || 'Unknown error'}`);
    }
    
    // Return the edited image URL from OpenAI
    return new Response(
      JSON.stringify({
        success: true,
        editedImageUrl: openAIData.data[0].url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in edit-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
