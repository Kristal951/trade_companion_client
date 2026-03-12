import React, { useState } from "react";
import { FiUpload } from "react-icons/fi"; // Feather Upload Icon

const FileUpload = ({
  label,
  hint,
  onFileSelect,
}: {
  label: string;
  hint: string;
  onFileSelect: (file: File | null) => void;
}) => {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <label className="group flex items-center justify-center flex-col gap-3 w-full px-4 py-3 border border-light-gray rounded-lg bg-light-surface cursor-pointer transition hover:border-primary hover:shadow-sm">
      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary group-hover:bg-primary/15">
        <FiUpload size={18} />
      </div>

      <div className="flex-1 flex flex-col text-left items-center justify-center">
        <p className="text-sm font-semibold text-dark-text leading-tight">
          {label}
        </p>
        <p className="text-xs text-mid-text text-center">
          {fileName ?? hint}
        </p>
      </div>

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          setFileName(file ? file.name : null);
          onFileSelect(file);
        }}
        className="hidden"
      />
    </label>
  );
};

export default FileUpload;
