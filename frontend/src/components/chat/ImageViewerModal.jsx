import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

export const ImageViewerModal = ({ imageUrl, fileName, onClose }) => {
  const [zoom, setZoom] = useState(1);

  if (!imageUrl) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.6));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName || 'downloaded-image.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(16px)',
        zIndex: 2000
      }}
    >
      {/* Lightbox Controls */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 2010
        }}
      >
        <button className="icon-btn" onClick={handleZoomIn} style={{ color: 'white', background: 'rgba(255,255,255,0.1)' }} title="Zoom In">
          <ZoomIn size={20} />
        </button>

        <button className="icon-btn" onClick={handleZoomOut} style={{ color: 'white', background: 'rgba(255,255,255,0.1)' }} title="Zoom Out">
          <ZoomOut size={20} />
        </button>

        <button className="icon-btn" onClick={handleDownload} style={{ color: 'white', background: 'rgba(255,255,255,0.1)' }} title="Download Image">
          <Download size={20} />
        </button>

        <button className="icon-btn" onClick={onClose} style={{ color: 'white', background: 'rgba(255,255,255,0.2)' }} title="Close Viewer">
          <X size={22} />
        </button>
      </div>

      {/* Image Render */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          overflow: 'hidden'
        }}
      >
        <img
          src={imageUrl}
          alt={fileName || 'View'}
          style={{
            maxWidth: '90vw',
            maxHeight: '85vh',
            objectFit: 'contain',
            borderRadius: '12px',
            transform: `scale(${zoom})`,
            transition: 'transform 0.2s ease',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
          }}
        />
      </div>
    </div>
  );
};
