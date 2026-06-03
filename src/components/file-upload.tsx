"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, ImageIcon, FileSpreadsheet, File } from "lucide-react";

export interface AttachedFile {
  file: File;
}

interface Props {
  onChange: (files: File[]) => void;
}

const MAX_FILES = 5;
const MAX_MB = 3;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ACCEPT = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xls,.xlsx,.csv";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-blue-400" />;
  if (type === "application/pdf") return <FileText className="h-4 w-4 text-red-400" />;
  if (type.includes("sheet") || type.includes("csv")) return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  return <File className="h-4 w-4 text-gray-400" />;
}

export function FileUpload({ onChange }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    setError(null);
    const toAdd: File[] = [];

    for (const file of Array.from(incoming)) {
      if (files.length + toAdd.length >= MAX_FILES) {
        setError(`Máximo de ${MAX_FILES} arquivos permitido.`);
        break;
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" excede o limite de ${MAX_MB}MB.`);
        continue;
      }
      if (files.some(f => f.name === file.name && f.size === file.size)) continue;
      toAdd.push(file);
    }

    const updated = [...files, ...toAdd];
    setFiles(updated);
    onChange(updated);
  }

  function remove(i: number) {
    const updated = files.filter((_, idx) => idx !== i);
    setFiles(updated);
    onChange(updated);
    setError(null);
  }

  const full = files.length >= MAX_FILES;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !full && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!full) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
          ${full ? "opacity-40 cursor-not-allowed border-gray-200" : "cursor-pointer"}
          ${dragging ? "border-[#AAFF00]/60 bg-[#AAFF00]/5" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}
        `}
      >
        <Upload className={`h-6 w-6 mx-auto mb-2 transition-colors ${dragging ? "text-[#AAFF00]" : "text-gray-300"}`} />
        <p className="text-sm text-gray-500 font-medium">
          {full ? "Limite de arquivos atingido" : "Arraste ou clique para anexar"}
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Até {MAX_FILES} arquivos · {MAX_MB}MB cada · PDF, DOCX, imagens, planilhas
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 group">
              <FileIcon type={f.type} />
              <span className="flex-1 text-sm text-gray-700 truncate">{f.name}</span>
              <span className="text-xs text-gray-400 shrink-0">{formatSize(f.size)}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-gray-400 hover:text-red-400 active:text-red-500 transition-colors sm:opacity-0 sm:group-hover:opacity-100 p-1 -mr-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
