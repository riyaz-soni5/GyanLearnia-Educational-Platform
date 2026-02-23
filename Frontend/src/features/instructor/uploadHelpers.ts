import { supabase } from "../../lib/supabase";

export async function uploadFileToCloud(opts: {
  file: File;
  kind: "thumbnail" | "resource" | "video";
}) {
  const { file, kind } = opts;

  const fileName = `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from("courses")
    .upload(`${kind}/${fileName}`, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data: publicUrl } = supabase.storage
    .from("courses")
    .getPublicUrl(data.path);

  return {
    publicUrl: publicUrl.publicUrl,
    key: data.path,
    name: file.name,
    sizeBytes: file.size,
    contentType: file.type,
  };
}

export async function getVideoDurationMin(file: File): Promise<number> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const sec = await new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = objectUrl;

      video.onloadedmetadata = () => {
        const raw = Number(video.duration || 0);
        resolve(raw);
      };
      video.onerror = () => reject(new Error("Could not read video metadata"));
    });

    return Math.max(1, Math.round(sec / 60));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
