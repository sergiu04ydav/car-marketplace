/**
 * hooks/useImageUpload.js
 *
 * Drag-and-drop + click-to-upload hook.
 * Trimite imaginile direct la POST /api/upload/images (multipart/form-data)
 * și primește URL-uri Cloudinary înapoi.
 */

import { useState, useCallback, useRef } from 'react';
import { API_BASE } from '../utils/api';

export function useImageUpload({ maxImages = 10, initialImages = [] } = {}) {
  const [images, setImages]           = useState(initialImages);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging]   = useState(false);
  const inputRef = useRef(null);

  /* ── Upload ─────────────────────────────────────────────── */
  const uploadFiles = useCallback(async (files) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!fileArray.length) return;

    setImages((prev) => {
      const remaining = maxImages - prev.length;
      if (remaining <= 0) {
        setUploadError(`Maximum ${maxImages} imagini permise.`);
        return prev;
      }

      const toUpload = fileArray.slice(0, remaining);

      // Run the actual upload asynchronously
      (async () => {
        setUploading(true);
        setUploadError('');
        try {
          const formData = new FormData();
          toUpload.forEach((f) => formData.append('images', f));

          // Use fetch directly — NOT apiFetch — so we never set Content-Type manually.
          // The browser sets multipart/form-data + boundary automatically.
          const res = await fetch(`${API_BASE}/api/upload/images`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
            // NO headers: {} — browser sets Content-Type with boundary
          });

          const json = await res.json().catch(() => ({}));

          if (!res.ok || !json.success) {
            throw new Error(json.message || `Upload eșuat (${res.status})`);
          }

          setImages((cur) => [...cur, ...json.urls]);
        } catch (err) {
          setUploadError(err.message || 'Upload eșuat. Încearcă din nou.');
        } finally {
          setUploading(false);
        }
      })();

      return prev; // state unchanged until async finishes
    });
  }, [maxImages]);

  /* ── Remove ─────────────────────────────────────────────── */
  const removeImage = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    // NOTE: We skip the Cloudinary DELETE here intentionally.
    // Images not attached to a listing are cheap and expire.
    // If you want server-side delete, uncomment below:
    /*
    const url = images[index];
    fetch(`${API_BASE}/api/upload/image`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }).catch(() => {});
    */
  }, []);

  /* ── Reorder ─────────────────────────────────────────────── */
  const moveImage = useCallback((fromIndex, toIndex) => {
    setImages((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  /* ── Drag handlers ──────────────────────────────────────── */
  const onDragEnter = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); }, []);
  const onDragOver  = useCallback((e) => { e.preventDefault(); e.stopPropagation(); }, []);
  const onDrop      = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer?.files?.length) uploadFiles(e.dataTransfer.files); }, [uploadFiles]);

  const getRootProps = useCallback(() => ({
    onDragEnter, onDragLeave, onDragOver, onDrop,
    onClick: () => inputRef.current?.click(),
    style: { cursor: 'pointer' },
  }), [onDragEnter, onDragLeave, onDragOver, onDrop]);

  const getInputProps = useCallback(() => ({
    ref: inputRef,
    type: 'file',
    accept: 'image/jpeg,image/png,image/webp',
    multiple: true,
    style: { display: 'none' },
    onChange: (e) => {
      if (e.target.files?.length) uploadFiles(e.target.files);
      e.target.value = '';
    },
  }), [uploadFiles]);

  return { images, setImages, uploading, uploadError, isDragging, getRootProps, getInputProps, removeImage, moveImage, uploadFiles };
}