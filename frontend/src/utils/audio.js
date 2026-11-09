/**
 * Synthesizes subtle, organic audio chimes and procedural offline soundscapes
 * using pure browser Web Audio API. Requires no external audio files.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Active procedural soundscape state
let activeSoundscape = {
  type: null,
  nodes: [],
  masterGain: null,
  volume: 0.35,
};

function createPinkNoiseBuffer(ctx, seconds = 4) {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
    b6 = white * 0.115926;
  }
  return buffer;
}

export const soundscapeEngine = {
  start: (type = 'rain', volume = activeSoundscape.volume) => {
    try {
      soundscapeEngine.stop();
      const ctx = getAudioContext();
      if (!ctx) return false;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(Math.max(0.01, volume * 0.45), now + 0.8);
      masterGain.connect(ctx.destination);

      const nodes = [];

      if (type === 'rain' || type === 'pink') {
        const noiseBuffer = createPinkNoiseBuffer(ctx, 5);
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(type === 'rain' ? 680 : 1150, now);

        if (type === 'rain') {
          // Subtle LFO modulation to mimic natural rainfall patter
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.type = 'sine';
          lfo.frequency.setValueAtTime(0.18, now);
          lfoGain.gain.setValueAtTime(140, now);
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start(now);
          nodes.push(lfo);
        }

        source.connect(filter);
        filter.connect(masterGain);
        source.start(now);
        nodes.push(source);
      } else if (type === 'zen') {
        // Warm harmonic ambient pad (174Hz, 261.63Hz, 392Hz)
        const freqs = [174, 261.63, 392.0];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);
          oscGain.gain.setValueAtTime(0.18 / (idx + 1), now);

          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.type = 'sine';
          lfo.frequency.setValueAtTime(0.08 + idx * 0.03, now);
          lfoGain.gain.setValueAtTime(0.05, now);
          lfo.connect(lfoGain);
          lfoGain.connect(oscGain.gain);

          osc.connect(oscGain);
          oscGain.connect(masterGain);
          osc.start(now);
          lfo.start(now);
          nodes.push(osc, lfo);
        });
      }

      activeSoundscape = {
        type,
        nodes,
        masterGain,
        volume,
      };
      return true;
    } catch {
      return false;
    }
  },

  setVolume: (volume) => {
    activeSoundscape.volume = volume;
    try {
      const ctx = getAudioContext();
      if (ctx && activeSoundscape.masterGain) {
        activeSoundscape.masterGain.gain.setTargetAtTime(
          Math.max(0.001, volume * 0.45),
          ctx.currentTime,
          0.1
        );
      }
    } catch {
      // ignore
    }
  },

  stop: () => {
    try {
      activeSoundscape.nodes.forEach((n) => {
        try {
          n.stop();
          n.disconnect();
        } catch {
          // ignore
        }
      });
      if (activeSoundscape.masterGain) {
        activeSoundscape.masterGain.disconnect();
      }
    } catch {
      // ignore
    }
    activeSoundscape = {
      type: null,
      nodes: [],
      masterGain: null,
      volume: activeSoundscape.volume,
    };
  },

  getState: () => ({
    isPlaying: Boolean(activeSoundscape.type),
    type: activeSoundscape.type,
    volume: activeSoundscape.volume,
  }),
};

export const soundEffects = {
  // Delicate dual-tone chime for task completion
  playTaskCompleted: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // C5 (523.25Hz) to E5 (659.25Hz)
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

      osc2.frequency.setValueAtTime(1046.5, now);
      osc2.frequency.exponentialRampToValueAtTime(1318.5, now + 0.15);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {
      // Audio not permitted or supported
    }
  },

  // Soft Zen bell for timer finish / Pomodoro
  playTimerBell: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    } catch {
      // Ignore
    }
  },

  // Soft crystalline chime on app splash launch
  playChime: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Ignore
    }
  },

  // Crisp satisfying micro-tick for checklist checking
  playCheckTick: (pitch = 1) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(1760 * pitch, now + 0.08);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Audio not permitted or supported
    }
  },

  // Warm lush harmonic entrance chord (C5, E5, G5, C6)
  playWarmChord: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        gain.gain.setValueAtTime(0.001, now + i * 0.04);
        gain.gain.linearRampToValueAtTime(0.04, now + i * 0.04 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + 1.45);
      });
    } catch {
      // Audio not permitted or supported
    }
  },

  // Soft tone cue for Box Breathing phase transitions
  playBreathCue: (freq = 432) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.75);
    } catch {
      // Ignore
    }
  },
};

export const audio = soundEffects;
