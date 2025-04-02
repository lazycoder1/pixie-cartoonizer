
// Store the edited image results in the database
export async function storeEditResults(supabase, userId, photoId, prompt, editedImageUrl) {
  try {
    // First try to update an existing record
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
        throw insertError;
      } else {
        console.log('Edited photo inserted successfully with ID:', insertData.id);
      }
    } else {
      console.log('Edited photo updated successfully with ID:', editData.id);
    }
  } catch (error) {
    console.error('Database operation error:', error);
    throw error;
  }
}
