'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  RefreshCw,
  ExternalLink,
  Link as LinkIcon,
  Plus,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface SingleImageUploadProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
  onUploadingChange?: (isUploading: boolean) => void;
}

export function SingleImageUpload({
  label,
  required = false,
  value,
  onChange,
  helperText = 'PNG, JPG, JPEG, WEBP hoặc GIF (Tối đa 10MB)',
  onUploadingChange,
}: SingleImageUploadProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  const handleUploadFile = async (file: File) => {
    setErrorMsg(null);

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Dung lượng tệp vượt quá 10MB. Vui lòng chọn tệp nhỏ hơn.');
      return;
    }

    // Validate extension
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setErrorMsg('Định dạng tệp không hợp lệ. Chỉ chấp nhận PNG, JPG, JPEG, WEBP, GIF.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetchApi('/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.data?.url) {
        onChange(res.data.url);
      } else {
        setErrorMsg(res.message || 'Tải ảnh lên máy chủ thất bại');
      }
    } catch {
      setErrorMsg('Đã có lỗi xảy ra trong quá trình tải ảnh.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
          {label} {required && <span className="text-rose-600 dark:text-signal-rose">*</span>}
        </label>
        <div className="flex items-center gap-1 bg-surface-subtle/50 dark:bg-surface-elevated p-0.5 rounded-lg text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-0.5 rounded-md transition-all ${
              mode === 'upload'
                ? 'bg-surface-card text-slate-950 dark:text-white hairline-border font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            Từ máy tính
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-0.5 rounded-md transition-all ${
              mode === 'url'
                ? 'bg-surface-card text-slate-950 dark:text-white hairline-border font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            Nhập URL
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {mode === 'url' ? (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface-subtle/40 dark:bg-surface-elevated hairline-border text-xs text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 dark:focus:border-signal-cyan font-mono"
            />
            <LinkIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
          {value && (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-subtle/30 dark:bg-surface-elevated/70 hairline-border surface-bevel">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden hairline-border flex-shrink-0 bg-surface-subtle/50">
                <Image src={value} alt="Preview" fill className="object-cover" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate">{value}</p>
              </div>
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-1 rounded-lg text-rose-600 dark:text-signal-rose hover:bg-rose-500/10 transition-colors"
                title="Xóa ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {value ? (
            /* Preview existing uploaded image */
            <div className="relative group rounded-xl hairline-border surface-bevel bg-surface-subtle/30 dark:bg-surface-elevated/70 p-3 flex items-center gap-4 transition-all">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden hairline-border flex-shrink-0 bg-surface-subtle/50 shadow-sm">
                <Image src={value} alt="Thumbnail" fill className="object-cover" unoptimized />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-signal-emerald font-semibold text-xs">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Ảnh đã sẵn sàng</span>
                </div>
                <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate max-w-xs">{value}</p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-surface-elevated dark:hover:bg-surface-subtle text-slate-950 dark:text-white hairline-border border-slate-300 dark:border-white/10 transition-colors shadow-sm"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span>Đổi ảnh</span>
                  </button>

                  <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                    title="Xem ảnh gốc"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => onChange('')}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-signal-rose transition-colors"
                    title="Xóa ảnh"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-slate-900 bg-slate-100 dark:border-signal-cyan dark:bg-signal-cyan/10 scale-[0.99]'
                  : 'border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-signal-cyan/50 bg-surface-subtle/20 dark:bg-surface-elevated/40'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-3 space-y-2">
                  <Loader2 className="w-6 h-6 text-slate-900 dark:text-signal-cyan animate-spin" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Đang tải ảnh lên máy chủ...
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Vui lòng đợi trong giây lát</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
                  <div className="w-9 h-9 rounded-lg bg-surface-elevated hairline-border text-slate-900 dark:text-white flex items-center justify-center">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Bấm để chọn tệp hoặc kéo thả ảnh vào đây
                  </p>
                  <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400">{helperText}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-signal-rose bg-rose-500/10 p-2 rounded-lg hairline-border border-rose-500/20 font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}

interface GalleryUploadProps {
  label?: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  onUploadingChange?: (isUploading: boolean) => void;
}

export function GalleryUpload({
  label = 'Bộ sưu tập ảnh phụ (Gallery)',
  images,
  onChange,
  maxImages = 8,
  onUploadingChange,
}: GalleryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  const handleUploadFiles = async (files: FileList) => {
    setErrorMsg(null);
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setErrorMsg(`Chỉ được tải tối đa ${maxImages} ảnh cho bộ sưu tập.`);
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(`Tệp "${file.name}" vượt quá 10MB.`);
        return;
      }
      formData.append('images', file);
    }

    setIsUploading(true);
    try {
      const res = await fetchApi('/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.data) {
        const newUrls: string[] = [];
        if (res.data.files && Array.isArray(res.data.files)) {
          res.data.files.forEach((f: any) => {
            if (f.url) newUrls.push(f.url);
          });
        } else if (res.data.url) {
          newUrls.push(res.data.url);
        }

        onChange([...images, ...newUrls]);
      } else {
        setErrorMsg(res.message || 'Tải ảnh lên thất bại.');
      }
    } catch {
      setErrorMsg('Đã có lỗi xảy ra khi tải ảnh lên.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
          {label} <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">({images.length}/{maxImages})</span>
        </label>
        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Tối đa {maxImages} ảnh chi tiết</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleUploadFiles(e.target.files);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-square rounded-lg overflow-hidden hairline-border bg-surface-subtle/50 group shadow-sm"
          >
            <Image src={img} alt={`Gallery ${idx + 1}`} fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/80 text-white hover:bg-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Xóa ảnh"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-lg border border-dashed border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-signal-cyan flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all bg-surface-subtle/20 dark:bg-surface-elevated/40"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-900 dark:text-signal-cyan" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold mt-0.5">Thêm</span>
              </>
            )}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-signal-rose bg-rose-500/10 p-2 rounded-lg hairline-border border-rose-500/20 font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
