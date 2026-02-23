import { supabase } from "../lib/supabase";

export async function uploadFileToSupabase(file: File, folder: string) {
  const fileName = `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from("courses")
    .upload(`${folder}/${fileName}`, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data: publicUrl } = supabase.storage
    .from("courses")
    .getPublicUrl(data.path);

  return publicUrl.publicUrl;
}