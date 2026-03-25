import { supabase } from '@/lib/supabase';

// Initialize Supabase client

export const uploadImageToBucket = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;  // Using timestamp for a unique file name
    const filePath = `restaurent-cover/${fileName}`;  // This should be sufficient, without an additional 'restaurent-cover' folder
  
    const { error: uploadError } = await supabase.storage
      .from("restaurent-cover")
      .upload(filePath, file, { upsert: true });  // upsert will replace if file already exists
  
    if (uploadError) {
      console.error("Image upload failed:", uploadError.message);
      return null;
    }
  
    // Correct the bucket name to 'restaurent-cover' for URL generation
    const { data } = supabase.storage.from("restaurent-cover").getPublicUrl(filePath);
    
    if (!data) {
      console.error("Failed to get the public URL");
      return null;
    }
  
    return data.publicUrl; // Return the correct URL
  };