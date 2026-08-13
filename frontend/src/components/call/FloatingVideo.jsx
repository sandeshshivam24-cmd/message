import React, { useState, useEffect, useRef } from 'react';
import { useCall } from '../../context/CallContext';
import { Maximize2, PhoneOff, Mic, MicOff, SwitchCamera } from 'lucide-react';

export const FloatingVideo = () => {
  const {
    callState,
    callType,
    isMuted,
    isMinimized,
    facingMode,
    isSwitchingCamera,
    remoteStreamRef,
    endCall,
    toggleMute,
    switchCamera,
    setIsMinimized
  } = useCall();

  const miniVideoRef = useRef(null);

  // Floating Window Dimensions
  const WINDOW_WIDTH = 180;
  const WINDOW_HEIGHT = 240;
  const MARGIN = 10;

  // Initialize position at Bottom-Right of viewport
  const [position, setPosition] = useState(() => ({
    x: typeof window !== 'undefined' ? Math.max(MARGIN, window.innerWidth - WINDOW_WIDTH - 24) : 200,
    y: typeof window !== 'undefined' ? Math.max(MARGIN, window.innerHeight - WINDOW_HEIGHT - 84) : 200
  }));

  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Clamp position within viewport boundaries
  const clampPosition = (x, y) => {
    const maxX = Math.max(MARGIN, window.innerWidth - WINDOW_WIDTH - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - WINDOW_HEIGHT - MARGIN);
    return {
      x: Math.max(MARGIN, Math.min(x, maxX)),
      y: Math.max(MARGIN, Math.min(y, maxY))
    };
  };

  // Re-clamp position on window resize / orientation change
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => clampPosition(prev.x, prev.y));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Attach remote stream to video element
  useEffect(() => {
    if (miniVideoRef.current && remoteStreamRef.current && isMinimized) {
      miniVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [isMinimized, remoteStreamRef.current]);

  if (!isMinimized || callState === 'idle') return null;

  // Pointer Drag Event Handlers
  const handlePointerDown = (e) => {
    // If pointer target is a button or inside a button, do not initiate window drag
    if (e.target.closest('button')) {
      return;
    }

    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;

    const rawX = e.clientX - dragOffsetRef.current.x;
    const rawY = e.clientY - dragOffsetRef.current.y;

    const clamped = clampPosition(rawX, rawY);
    setPosition(clamped);
  };

  const handlePointerUp = (e) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${WINDOW_WIDTH}px`,
        height: `${WINDOW_HEIGHT}px`,
        borderRadius: '18px',
        overflow: 'hidden',
        background: '#121826',
        border: '2px solid rgba(99, 102, 241, 0.5)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7)',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(10px)',
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none'
      }}
    >
      {/* Mini Video Container View */}
      <div style={{ flex: 1, position: 'relative', background: '#000000', pointerEvents: 'none' }}>
        {callType === 'video' ? (
          <video
            ref={miniVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: '700' }}>
            📞 Audio Call
          </div>
        )}

        {/* Expand / Maximize Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(false);
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.65)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'auto',
            border: 'none',
            cursor: 'pointer'
          }}
          title="Full Screen Video"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Mini Bar Action Controls */}
      <div
        style={{
          padding: '8px',
          background: 'rgba(18, 24, 38, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          pointerEvents: 'auto'
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          style={{ color: isMuted ? '#f43f5e' : 'white', background: 'none', border: 'none', cursor: 'pointer' }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        {callType === 'video' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              switchCamera();
            }}
            disabled={isSwitchingCamera}
            style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', opacity: isSwitchingCamera ? 0.5 : 1 }}
            title={`Switch Camera (${facingMode === 'user' ? 'Front' : 'Back'})`}
          >
            <SwitchCamera size={16} className={isSwitchingCamera ? 'spin' : ''} />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            endCall();
          }}
          style={{ color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer' }}
          title="End Call"
        >
          <PhoneOff size={16} />
        </button>
      </div>
    </div>
  );
};
