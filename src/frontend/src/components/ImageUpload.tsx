import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  maxImages = 1,
  label,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const canAdd = value.length < maxImages;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    try {
      // Compress image if too large (> 200KB)
      const base64 = await compressAndEncode(file);
      onChange([...value, base64]);
      toast.success("Image uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}

      <div className="flex flex-wrap gap-2">
        {/* Existing images */}
        {value.map((url, idx) => (
          <div
            key={url.length > 50 ? url.slice(0, 50) : url}
            className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border/60 bg-muted/30"
          >
            <img
              src={url}
              alt={`Upload ${idx + 1}`}
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              data-ocid="image.delete_button"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Upload spinner */}
        {uploading && (
          <div className="w-20 h-20 rounded-lg border border-border/60 bg-muted/30 flex flex-col items-center justify-center gap-1">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {/* Add photo button */}
        {canAdd && !uploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
            data-ocid="image.upload_button"
          >
            <Camera className="h-5 w-5" />
            <span className="text-[10px]">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

async function compressAndEncode(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 600;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const scale = MAX / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}
