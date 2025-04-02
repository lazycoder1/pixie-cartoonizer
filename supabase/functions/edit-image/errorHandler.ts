
// Handle errors from the image processing workflow
export async function handleErrors(apiError, supabase, userId, photoId, prompt, corsHeaders) {
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
