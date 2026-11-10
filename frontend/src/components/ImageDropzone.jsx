import { useEffect, useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, RefreshCw, Trash2 } from 'lucide-react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_EXT_REGEX = /\.(jpe?g|png|webp|gif)$/i;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageDropzone({
  file,
  existingUrl = '',
  removed = false,
  onChange,
  label = 'Gambar',
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [objectUrl, setObjectUrl] = useState('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!file) {
      setObjectUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setImgError(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    setImgError(false);
  }, [existingUrl, removed]);

  const previewSrc = objectUrl || (!removed ? existingUrl : '');

  const handleFileSelect = (selected) => {
    if (!selected) return;
    setError('');

    const isValidType =
      ACCEPTED_TYPES.includes(selected.type) ||
      (!selected.type && ACCEPTED_EXT_REGEX.test(selected.name));

    if (!isValidType) {
      setError('Format gambar harus JPG, PNG, WebP, atau GIF.');
      return;
    }

    if (selected.size > MAX_SIZE_BYTES) {
      setError('Ukuran gambar maksimal 5 MB.');
      return;
    }

    onChange({ file: selected, removed: false });
  };

  const handleInputChange = (e) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    handleFileSelect(selected);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    handleFileSelect(dropped);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setError('');
    onChange({ file: null, removed: true });
  };

  const handleBrowse = (e) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-coffee-600 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />
      <div
        role="button"
        tabIndex={0}
        onClick={handleBrowse}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-4 transition-all cursor-pointer select-none ${isDragging
            ? 'border-coffee-600 bg-coffee-50 ring-2 ring-coffee-200'
            : 'border-coffee-200 bg-coffee-50/40 hover:border-coffee-400 hover:bg-coffee-50/80'
          }`}
      >
        {previewSrc ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-coffee-200 shrink-0 flex items-center justify-center">
                {!imgError ? (
                  <img
                    src={previewSrc}
                    alt="Preview gambar"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={24} className="text-coffee-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {file ? (
                  <>
                    <p className="text-sm font-medium text-coffee-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-coffee-500 mt-0.5">
                      {formatFileSize(file.size)} · Siap diunggah
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-coffee-900">
                      Gambar saat ini
                    </p>
                    <p className="text-xs text-coffee-500 mt-0.5">
                      Seret gambar baru ke sini atau klik untuk mengganti
                    </p>
                  </>
                )}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={handleBrowse}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-coffee-200 text-xs font-medium text-coffee-800 hover:border-coffee-400 hover:bg-coffee-50 transition-colors"
                  >
                    <RefreshCw size={12} /> Ganti Gambar
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              </div>
            </div>
            ) : (
            <div className="flex flex-col items-center justify-center text-center py-3">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center mb-2.5 transition-colors ${isDragging
                    ? 'bg-coffee-900 text-white'
                    : 'bg-coffee-100 text-coffee-700'
                  }`}
              >
                <UploadCloud size={22} />
              </div>
              <p className="text-sm font-medium text-coffee-900">
                {isDragging
                  ? 'Lepaskan gambar di sini...'
                  : 'Seret & lepas gambar ke sini, atau klik untuk pilih file'}
              </p>
              <p className="text-xs text-coffee-500 mt-1">
                JPG, PNG, WebP, atau GIF (maks. 5 MB)
              </p>
            </div>
        )}
          </div>
      {error && (
          <p className="text-xs text-red-600 mt-1.5" role="alert">
            {error}
          </p>
        )}
      </div>
      );
}

