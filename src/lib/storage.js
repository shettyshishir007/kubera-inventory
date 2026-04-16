import { supabase } from "./supabase";

export async function uploadImage(file) {
  const ext = file.name.split(".").pop();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `items/${name}`;

  const { error } = await supabase.storage.from("images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}
