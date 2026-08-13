import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  // Call States: 'idle' | 'calling' | 'incoming' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'ended'
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('video'); // 'audio' | 'video'
  const [peerDetails, setPeerDetails] = useState(null); // { id, name, avatar }
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Camera Facing Mode: 'user' (front) | 'environment' (back/rear)
  const [facingMode, setFacingMode] = useState('user');
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pcRef = useRef(null);
  const timerRef = useRef(null);
  const ringtoneTimerRef = useRef(null);

  // ICE Server configuration (STUN default + TURN env fallback)
  const getIceServers = () => {
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];

    const turnUrl = import.meta.env.VITE_TURN_URL;
    const turnUser = import.meta.env.VITE_TURN_USERNAME;
    const turnPass = import.meta.env.VITE_TURN_CREDENTIAL;

    if (turnUrl && turnUser && turnPass) {
      iceServers.push({
        urls: turnUrl,
        username: turnUser,
        credential: turnPass
      });
    }

    return iceServers;
  };

  // Create PeerConnection instance
  const createPeerConnection = (targetUserId) => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection({ iceServers: getIceServers() });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice-candidate', {
          recipientId: targetUserId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setCallState(prev => prev === 'connecting' ? 'connected' : prev);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('WebRTC Connection State:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('connected');
        startCallTimer();
      } else if (pc.connectionState === 'disconnected') {
        setCallState('reconnecting');
        pc.restartIce();
      } else if (pc.connectionState === 'failed') {
        setCallState('failed');
        setTimeout(endCall, 2000);
      }
    };

    pcRef.current = pc;
    return pc;
  };

  // Acquire Media Tracks
  const getUserMediaStream = async (requestedType, preferredFacing = 'user') => {
    try {
      const constraints = {
        audio: true,
        video: requestedType === 'video' ? { facingMode: preferredFacing } : false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setFacingMode(preferredFacing);
      return stream;
    } catch (err) {
      console.error('Error accessing camera/microphone:', err);
      alert(`Could not access ${requestedType === 'video' ? 'camera and microphone' : 'microphone'}. Please check browser permissions.`);
      throw err;
    }
  };

  // Initiate Outgoing Call
  const startCall = async (recipientUser, type = 'video') => {
    if (callState !== 'idle') return;

    try {
      setCallType(type);
      setPeerDetails({
        id: recipientUser.id,
        name: recipientUser.displayName || recipientUser.username,
        avatar: recipientUser.avatarUrl
      });
      setCallState('calling');
      setIsMuted(false);
      setIsVideoOff(false);
      setIsRemoteMuted(false);
      setIsRemoteVideoOff(false);
      setIsMinimized(false);

      const stream = await getUserMediaStream(type, 'user');
      const pc = createPeerConnection(recipientUser.id);

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      if (socket) {
        socket.emit('call:initiate', {
          recipientId: recipientUser.id,
          callType: type
        });
      }

      ringtoneTimerRef.current = setTimeout(() => {
        if (callState === 'calling') {
          endCall();
        }
      }, 30000);

    } catch (err) {
      endCall();
    }
  };

  // Accept Incoming Call
  const acceptCall = async () => {
    if (callState !== 'incoming' || !peerDetails) return;

    try {
      if (ringtoneTimerRef.current) clearTimeout(ringtoneTimerRef.current);
      setCallState('connecting');

      const stream = await getUserMediaStream(callType, 'user');
      const pc = createPeerConnection(peerDetails.id);

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      if (socket) {
        socket.emit('call:accept', { callerId: peerDetails.id });
      }
    } catch (err) {
      endCall();
    }
  };

  // Reject Incoming Call
  const rejectCall = () => {
    if (peerDetails && socket) {
      socket.emit('call:reject', { callerId: peerDetails.id, reason: 'declined' });
    }
    endCall();
  };

  // End Call & Cleanup
  const endCall = () => {
    if (peerDetails && socket) {
      socket.emit('call:end', { recipientId: peerDetails.id });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (ringtoneTimerRef.current) clearTimeout(ringtoneTimerRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    remoteStreamRef.current = null;
    setCallState('idle');
    setPeerDetails(null);
    setCallDuration(0);
    setIsMinimized(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsRemoteMuted(false);
    setIsRemoteVideoOff(false);
    setFacingMode('user');
    setIsSwitchingCamera(false);
  };

  const startCallTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMuted = !audioTrack.enabled;
        setIsMuted(newMuted);

        if (socket && peerDetails) {
          socket.emit('call:mute-toggle', {
            recipientId: peerDetails.id,
            isMuted: newMuted
          });
        }
      }
    }
  };

  // Toggle Camera Video On/Off
  const toggleVideo = () => {
    if (callType === 'audio') return;
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newVideoOff = !videoTrack.enabled;
        setIsVideoOff(newVideoOff);

        if (socket && peerDetails) {
          socket.emit('call:video-toggle', {
            recipientId: peerDetails.id,
            isVideoOff: newVideoOff
          });
        }
      }
    }
  };

  // Switch Camera Front <-> Rear using RTCRtpSender.replaceTrack()
  const switchCamera = async () => {
    if (callType !== 'video' || isSwitchingCamera) return;
    const targetFacingMode = facingMode === 'user' ? 'environment' : 'user';

    setIsSwitchingCamera(true);

    try {
      let newStream = null;

      // 1. Try exact constraint
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: targetFacingMode } },
          audio: false
        });
      } catch (err1) {
        // 2. Fallback to ideal constraint
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacingMode },
            audio: false
          });
        } catch (err2) {
          // 3. Fallback to device enumeration
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');

          if (videoDevices.length > 1) {
            const currentTrack = localStreamRef.current?.getVideoTracks()[0];
            const currentLabel = currentTrack ? currentTrack.label : '';
            const otherDevice = videoDevices.find(d => !d.label || d.label !== currentLabel) || videoDevices[1];

            newStream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: otherDevice.deviceId } },
              audio: false
            });
          } else {
            throw new Error('No secondary camera detected on this device');
          }
        }
      }

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) throw new Error('Could not acquire new camera track');

      // Preserve current mute state on new track
      newVideoTrack.enabled = !isVideoOff;

      const oldStream = localStreamRef.current;
      const oldVideoTrack = oldStream?.getVideoTracks()[0];
      const audioTrack = oldStream?.getAudioTracks()[0];

      // Replace WebRTC sender track without disconnecting call
      if (pcRef.current) {
        const videoSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }

      // Stop old camera track
      if (oldVideoTrack) {
        oldVideoTrack.stop();
      }

      // Re-assemble local MediaStream
      const updatedStream = new MediaStream();
      if (audioTrack) updatedStream.addTrack(audioTrack);
      updatedStream.addTrack(newVideoTrack);
      localStreamRef.current = updatedStream;

      setFacingMode(targetFacingMode);

    } catch (err) {
      console.warn('Camera switch notice:', err.message);
      alert('Camera switch not available or secondary camera not found on this device.');
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  // Handle Socket Signaling Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('call:incoming', ({ callerId, callerName, callerAvatar, callType: reqType }) => {
      if (callState !== 'idle') {
        socket.emit('call:busy', { callerId });
        return;
      }

      setPeerDetails({ id: callerId, name: callerName, avatar: callerAvatar });
      setCallType(reqType);
      setCallState('incoming');
    });

    socket.on('call:accepted', async () => {
      if (callState === 'calling' && pcRef.current && peerDetails) {
        setCallState('connecting');
        try {
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          socket.emit('call:offer', { recipientId: peerDetails.id, offer });
        } catch (err) {
          console.error('Error creating WebRTC offer:', err);
        }
      }
    });

    socket.on('call:offer', async ({ callerId, offer }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          socket.emit('call:answer', { callerId, answer });
        } catch (err) {
          console.error('Error handling WebRTC offer:', err);
        }
      }
    });

    socket.on('call:answer', async ({ answer }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error handling WebRTC answer:', err);
        }
      }
    });

    socket.on('call:ice-candidate', async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    socket.on('call:rejected', ({ reason }) => {
      setCallState('failed');
      setTimeout(cleanupCall, 2000);
    });

    socket.on('call:ended', () => {
      cleanupCall();
    });

    socket.on('call:remote-mute', ({ isMuted: remoteMuted }) => {
      setIsRemoteMuted(remoteMuted);
    });

    socket.on('call:remote-video', ({ isVideoOff: remoteVideoOff }) => {
      setIsRemoteVideoOff(remoteVideoOff);
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:offer');
      socket.off('call:answer');
      socket.off('call:ice-candidate');
      socket.off('call:rejected');
      socket.off('call:ended');
      socket.off('call:remote-mute');
      socket.off('call:remote-video');
    };
  }, [socket, callState, peerDetails]);

  return (
    <CallContext.Provider
      value={{
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
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        switchCamera,
        setIsMinimized
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
