
export interface Photo {
  id: string;
  url: string;
  name: string;
  created_at: string;
}

export interface EditingPhoto {
  id: string;
  instructions: string;
  status: "processing" | "complete" | "failed";
  editedImageUrl?: string;
  error?: string;
}
