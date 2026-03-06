import { ExternalBlob } from "@/backend";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  const [progress, setProgress] = useState(0);

  const canAdd = value.length < maxImages;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = "";

    setUploading(true);
    setProgress(0);

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
        (pct: number) => setProgress(pct),
      );
      // Trigger upload by getting URL (upload happens lazily on getDirectURL)
      const url = blob.getDirectURL();
      onChange([...value, url]);
      toast.success("Image uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
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
            key={url}
            className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border/60 bg-muted/30"
          >
            <img
              src={url}
              alt={`Upload ${idx + 1}`}
              className="w-full h-full object-cover"
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

        {/* Upload progress placeholder */}
        {uploading && (
          <div className="w-20 h-20 rounded-lg border border-border/60 bg-muted/30 flex flex-col items-center justify-center gap-1">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <Progress value={progress} className="h-1 w-14" />
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
            <span className="text-[10px] font-medium">
              {value.length === 0 ? "Add photo" : "Add more"}
            </span>
          </button>
        )}
      </div>

      {maxImages > 1 && (
        <p className="text-[11px] text-muted-foreground">
          {value.length}/{maxImages} images
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-ocid="image.dropzone"
      />
    </div>
  );
}
