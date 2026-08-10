// Web Audio API Audio Synthesizer (No external asset files needed)

let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Play short pleasant chime sound for incoming messages
export const playMessageChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    // F5 & C6 chime frequencies
    osc1.frequency.setValueAtTime(698.46, now);
    osc2.frequency.setValueAtTime(1046.50, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.12);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch (err) {
    console.warn('Audio synth error:', err.message);
  }
};

// Play ringtone tone for incoming call
export const playRingTone = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return null;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 note

    gain.gain.setValueAtTime(0.1, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    return {
      stop: () => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      }
    };
  } catch (err) {
    return null;
  }
};
