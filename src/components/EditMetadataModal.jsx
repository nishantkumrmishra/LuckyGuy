import React, { useState } from 'react';
import { X, Image as ImageIcon, Music2, Check, Upload } from 'lucide-react';

export default function EditMetadataModal({
  track,
  isOpen,
  onClose,
  onSave
}) {
  if (!isOpen || !track) return null;

  const [title, setTitle] = useState(track.title || '');
  const [artist, setArtist] = useState(track.artist || '');
  const [album, setAlbum] = useState(track.album || '');
  const [artworkUrl, setArtworkUrl] = useState(track.artworkUrl || track.coverArt || '');

  const handleSave = () => {
    onSave?.(track, {
      title: title.trim() || track.title,
      artist: artist.trim() || track.artist,
      album: album.trim() || track.album,
      artworkUrl: artworkUrl.trim(),
    });
    onClose();
  };

  const handleArtworkFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setArtworkUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-card, #161616)',
          borderRadius: '16px',
          border: '1px solid var(--border-medium)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Edit Track Details
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Modify track title, artist, album, and custom cover artwork.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Artwork preview & input */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-medium)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            {artworkUrl ? (
              <img src={artworkUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Music2 size={32} color="var(--primary, #7c5cbf)" />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                width: 'fit-content',
              }}
            >
              <Upload size={13} />
              <span>Upload Custom Image</span>
              <input type="file" accept="image/*" onChange={handleArtworkFile} style={{ display: 'none' }} />
            </label>

            <input
              type="text"
              placeholder="Or paste image URL..."
              value={artworkUrl.startsWith('data:') ? 'Custom image loaded' : artworkUrl}
              onChange={(e) => setArtworkUrl(e.target.value)}
              disabled={artworkUrl.startsWith('data:')}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Text Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Artist</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Album</label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              fontSize: '12.5px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary, #7c5cbf)',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
