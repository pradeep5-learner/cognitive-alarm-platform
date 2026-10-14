function generateBeepDataUri(frequency = 880, beepDuration = 0.4, totalDuration = 1.0, sampleRate = 8000) {
  const numSamples = Math.floor(sampleRate * totalDuration);
  const beepSamples = Math.floor(sampleRate * beepDuration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    let sample = 0;
    if (i < beepSamples) {
      const t = i / sampleRate;
      const envelope = Math.sin((Math.PI * i) / beepSamples);
      sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4;
    }
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return "data:audio/wav;base64," + btoa(binary);
}

const RINGTONE_FREQS = {
  classic: 880,
  gentle: 600,
  urgent: 1100,
  chime: 750,
};

export const RINGTONE_OPTIONS = ["classic", "gentle", "urgent", "chime"];

let audioEl = null;
let pendingPlay = null;

export function startRinging(ringtoneName = "classic") {
  if (audioEl) return;

  const freq = RINGTONE_FREQS[ringtoneName] || RINGTONE_FREQS.classic;
  audioEl = new Audio(generateBeepDataUri(freq));
  audioEl.loop = true;
  audioEl.volume = 0.7;

  pendingPlay = audioEl.play();
  if (pendingPlay) {
    pendingPlay.catch((err) => {
      if (err.name !== "AbortError") console.log("Audio play blocked:", err);
    });
  }
}

export function stopRinging() {
  const el = audioEl;
  const p = pendingPlay;
  audioEl = null;
  pendingPlay = null;
  if (!el) return;

  if (p) {
    p.then(() => el.pause()).catch(() => el.pause());
  } else {
    el.pause();
  }
}

export function setSharedAudioContext() {
  // kept so existing imports don't break
}

export function isRinging() {
  return audioEl !== null;
}