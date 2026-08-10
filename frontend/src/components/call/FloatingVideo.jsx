import React, { useEffect, useRef } from 'react';
import { useCall } from '../../context/CallContext';
import { Maximize2, PhoneOff, Mic, MicOff } from 'lucide-react';

export const FloatingVideo = () => {
  const {
    callState,
    callType,
    peerDetails,
    isMuted,
    isMinimized,
    remoteStreamRef,
    endCall,
    toggleMute,
    setIsMinimized
  } = useCall();

  const miniVideoRef = useRef(null);

  useEffect(() => {
    if (miniVideoRef.current && remoteStreamRef.current && isMinimized) {
      miniVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [isMinimized, remoteStreamRef.current]);

  if (!isMinimized || callState === 'idle') return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '84px',
        right: '24px',
        width: '180px',
        height: '240px',
        borderRadius: '18px',
        overflow: 'hidden',
        background: '#121826',
        border: '2px solid rgba(99, 102, 241, 0.4)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div style={{ flex: 1, position: 'relative', background: '#000000' }}>
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
          onClick={() => setIsMinimized(false)}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
          title="Full Screen Video"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Mini Bar Actions */}
      <div
        style={{
          padding: '8px',
          background: 'rgba(18, 24, 38, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around'
        }}
      >
        <button
          onClick={toggleMute}
          style={{ color: isMuted ? '#f43f5e' : 'white', background: 'none' }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        <button
          onClick={endCall}
          style={{ color: '#f43f5e', background: 'none' }}
          title="End Call"
        >
          <PhoneOff size={16} />
        </button>
      </div>
    </div>
  );
};
