import React, { useEffect, useRef } from 'react';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, Minimize2, RefreshCw, SwitchCamera } from 'lucide-react';

export const CallModal = () => {
  const {
    callState,
    callType,
    peerDetails,
    isMuted,
    isVideoOff,
    isRemoteMuted,
    isRemoteVideoOff,
    isMinimized,
    callDuration,
    facingMode,
    isSwitchingCamera,
    localStreamRef,
    remoteStreamRef,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    setIsMinimized
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local media stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callState, localStreamRef.current, isVideoOff, isMinimized, facingMode]);

  // Attach remote media stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [callState, remoteStreamRef.current, isMinimized]);

  if (callState === 'idle' || isMinimized) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, padding: 0 }}>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#090d16',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
            zIndex: 30
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Avatar name={peerDetails?.name} avatarUrl={peerDetails?.avatar} size={42} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>
                {peerDetails?.name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                {callState === 'calling' && 'Ringing...'}
                {callState === 'incoming' && `Incoming ${callType} call`}
                {callState === 'connecting' && 'Connecting...'}
                {callState === 'reconnecting' && (
                  <span style={{ color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <RefreshCw size={12} className="spin" /> Reconnecting...
                  </span>
                )}
                {callState === 'connected' && formatDuration(callDuration)}
                {callState === 'failed' && 'Call Failed'}
              </div>
            </div>
          </div>

          {callState === 'connected' && callType === 'video' && (
            <button
              className="icon-btn"
              onClick={() => setIsMinimized(true)}
              title="Minimize Video"
              style={{ background: 'rgba(255, 255, 255, 0.15)', color: 'white' }}
            >
              <Minimize2 size={20} />
            </button>
          )}
        </div>

        {/* Video Container View */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Remote Video Stream */}
          {callType === 'video' && (callState === 'connected' || callState === 'reconnecting') ? (
            <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000000' }}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: isRemoteVideoOff ? 'none' : 'block'
                }}
              />

              {/* Remote Video Off / Muted Badges */}
              {isRemoteVideoOff && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#121826',
                    color: 'var(--text-muted)'
                  }}
                >
                  <Avatar name={peerDetails?.name} avatarUrl={peerDetails?.avatar} size={96} />
                  <span style={{ marginTop: '16px', fontSize: '0.95rem' }}>📷 Camera Off</span>
                </div>
              )}

              {isRemoteMuted && (
                <div
                  style={{
                    position: 'absolute',
                    top: '80px',
                    left: '24px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: 'rgba(244, 63, 94, 0.85)',
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    backdropFilter: 'blur(8px)',
                    zIndex: 20
                  }}
                >
                  🎤 Muted
                </div>
              )}

              {/* Local Self Preview Floating Box */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '100px',
                  right: '24px',
                  width: '140px',
                  height: '190px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  background: '#1a2336',
                  zIndex: 25
                }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                    display: isVideoOff ? 'none' : 'block'
                  }}
                />
                {isVideoOff && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}
                  >
                    Camera Off
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Audio Only or Calling State Avatar View */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <Avatar name={peerDetails?.name} avatarUrl={peerDetails?.avatar} size={120} />
              <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 700, color: 'white' }}>
                {peerDetails?.name}
              </h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {callType === 'audio' ? 'Audio Call' : 'Video Call'}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Call Action Control Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            zIndex: 30
          }}
        >
          {callState === 'incoming' ? (
            <>
              <button
                onClick={acceptCall}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                }}
                title="Accept Call"
              >
                <Phone size={28} />
              </button>

              <button
                onClick={rejectCall}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#f43f5e',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(244, 63, 94, 0.4)'
                }}
                title="Decline Call"
              >
                <PhoneOff size={28} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleMute}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: isMuted ? '#f43f5e' : 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              {callType === 'video' && (
                <>
                  <button
                    onClick={toggleVideo}
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: isVideoOff ? '#f43f5e' : 'rgba(255, 255, 255, 0.15)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                  </button>

                  <button
                    onClick={switchCamera}
                    disabled={isSwitchingCamera}
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.15)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isSwitchingCamera ? 0.5 : 1
                    }}
                    title={`Switch Camera (${facingMode === 'user' ? 'Front' : 'Back'})`}
                  >
                    <SwitchCamera size={22} className={isSwitchingCamera ? 'spin' : ''} />
                  </button>
                </>
              )}

              <button
                onClick={endCall}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#f43f5e',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(244, 63, 94, 0.4)'
                }}
                title="End Call"
              >
                <PhoneOff size={26} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
