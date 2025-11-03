import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, X } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface Project {
  project_id: string;
  project_name: string;
  description: string | null;
  number_of_documents: number;
}

export default function UploadDocuments({
  uploadDialogOpen,
  setUploadDialogOpen,
  project,
  selectedFiles,
  setSelectedFiles,
  uploadingFiles,
  handleUploadFiles,
}: {
  uploadDialogOpen: boolean;
  setUploadDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  project: Project | null;
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  uploadingFiles: string[];
  handleUploadFiles: () => Promise<void>;
}) {
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    noClick: false,
  });
  return (
    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload documents to {project?.project_name}
          </DialogDescription>
        </DialogHeader>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop files here...</p>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">
                Drag and drop files here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Upload multiple documents at once
              </p>
            </>
          )}
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedFiles.length} file
                {selectedFiles.length !== 1 ? "s" : ""} selected
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFiles([])}
              >
                Clear all
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={uploadingFiles.includes(file.name)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadingFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Uploading {uploadingFiles.length} file
              {uploadingFiles.length !== 1 ? "s" : ""}...
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedFiles([]);
              setUploadDialogOpen(false);
            }}
            disabled={uploadingFiles.length > 0}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUploadFiles}
            disabled={selectedFiles.length === 0 || uploadingFiles.length > 0}
          >
            {uploadingFiles.length > 0 ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
