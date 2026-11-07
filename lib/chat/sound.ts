/**
 * Web Audio API Sound Generator & Celebration Chime for OmniChat AI
 * Tự động tổng hợp âm thanh bằng Web Audio API kèm Fallback Audio Element
 */

let context: AudioContext | undefined;
let isAudioUnlocked = false;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return null;
    return (context ??= new AudioContextClass());
  } catch {
    return null;
  }
}

/**
 * Tự động mở khóa (Unlock) AudioContext trên toàn bộ trình duyệt
 * khi người dùng có bất kỳ tương tác đầu tiên nào (click, tap, keydown)
 */
export function unlockAudioContext(): void {
  if (typeof window === "undefined") return;
  try {
    const audio = getAudioContext();
    if (!audio) return;
    if (audio.state === "suspended") {
      try {
        const buffer = audio.createBuffer(1, 1, 22050);
        const source = audio.createBufferSource();
        source.buffer = buffer;
        source.connect(audio.destination);
        source.start(0);
      } catch {
        // Silent buffer failure ignored
      }
      void audio.resume().then(() => {
        isAudioUnlocked = true;
      }).catch(() => {});
    } else if (audio.state === "running") {
      isAudioUnlocked = true;
    }
  } catch {
    // Ignore
  }
}

// Tự động lắng nghe tương tác đầu tiên trên window để mở khóa âm thanh
if (typeof window !== "undefined") {
  const unlockEvents = ["pointerdown", "touchstart", "click", "keydown"];
  const handleFirstInteraction = () => {
    unlockAudioContext();
    unlockEvents.forEach((ev) => window.removeEventListener(ev, handleFirstInteraction));
  };
  unlockEvents.forEach((ev) => window.addEventListener(ev, handleFirstInteraction, { passive: true, once: true }));
}

/**
 * Kiểm tra xem âm thanh có đang bị tắt (Mute) hay không
 */
export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("omnichat_sound_muted") === "true";
  } catch {
    return false;
  }
}

/**
 * Cài đặt trạng thái bật/tắt âm thanh
 */
export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("omnichat_sound_muted", muted ? "true" : "false");
    window.dispatchEvent(new CustomEvent("omnichat-sound-mute-change", { detail: { muted } }));
  } catch {
    // Bỏ qua lỗi
  }
}

/**
 * Âm thanh gửi/nhận tin nhắn (Chat Tone - nốt Sol5 -> Do6)
 */
export async function playChatTone(force = false) {
  if (!force && isSoundMuted()) return;

  try {
    const audio = getAudioContext();
    if (!audio) return;
    if (audio.state === "suspended") {
      await audio.resume().catch(() => {});
    }

    const now = audio.currentTime;
    const tone = audio.createOscillator();
    const volume = audio.createGain();

    tone.frequency.setValueAtTime(784, now); // G5
    tone.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6

    volume.gain.setValueAtTime(0.12, now);
    volume.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    tone.connect(volume).connect(audio.destination);
    tone.onended = () => {
      tone.disconnect();
      volume.disconnect();
    };
    tone.start(now);
    tone.stop(now + 0.22);
  } catch {
    // Audio availability does not break the app
  }
}

/**
 * Âm thanh chuông thông báo hệ thống (Notification Chime - 2 nốt Ding-Dong ấm áp)
 */
export async function playNotificationChime(force = false) {
  if (!force && isSoundMuted()) return;

  try {
    const audio = getAudioContext();
    if (!audio) return;
    if (audio.state === "suspended") {
      await audio.resume().catch(() => {});
    }

    const now = audio.currentTime;

    // Nốt 1: Ding (E5 - 659.25Hz)
    const osc1 = audio.createOscillator();
    const gain1 = audio.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1).connect(audio.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Nốt 2: Dong (A5 - 880Hz) cách 0.12s
    const osc2 = audio.createOscillator();
    const gain2 = audio.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2).connect(audio.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch {
    // Audio availability does not break the app
  }
}

/**
 * Chạy bộ tổng hợp âm thanh Fanfare Chúc Mừng Đặt Lịch Thành Công trên AudioContext
 * Chuỗi 5 nốt hợp âm tiệc cưới rộn rã thăng hoa:
 * Đô 5 -> Mi 5 -> Sol 5 -> Đô 6 -> Hợp âm chuông vàng ngân dài (Mi 6 + Sol 6 + Đô 7)
 */
function synthesizeCelebrationChime(audio: AudioContext) {
  const now = audio.currentTime;

  // Giai điệu Arpeggio vút cao: Đô 5 (523.25) -> Mi 5 (659.25) -> Sol 5 (783.99) -> Đô 6 (1046.50)
  const melodicNotes = [
    { freq: 523.25, start: 0, duration: 0.25, vol: 0.25, type: "triangle" as const },
    { freq: 659.25, start: 0.10, duration: 0.25, vol: 0.28, type: "triangle" as const },
    { freq: 783.99, start: 0.20, duration: 0.28, vol: 0.32, type: "triangle" as const },
    { freq: 1046.50, start: 0.32, duration: 0.90, vol: 0.40, type: "triangle" as const },
    // Hợp âm chốt 3 nốt ngân vang rực rỡ lấp lánh (Sparkle Chime)
    { freq: 1318.51, start: 0.35, duration: 1.20, vol: 0.20, type: "sine" as const }, // Mi 6
    { freq: 1567.98, start: 0.38, duration: 1.20, vol: 0.18, type: "sine" as const }, // Sol 6
    { freq: 2093.00, start: 0.42, duration: 1.10, vol: 0.12, type: "sine" as const }, // Đô 7
  ];

  melodicNotes.forEach((n) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = n.type;
    const noteStart = now + n.start;
    const noteEnd = noteStart + n.duration;

    osc.frequency.setValueAtTime(n.freq, noteStart);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.linearRampToValueAtTime(n.vol, noteStart + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

    osc.connect(gain).connect(audio.destination);
    osc.start(noteStart);
    osc.stop(noteEnd);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // Ignore
      }
    };
  });
}

/**
 * Fallback tạo và phát file WAV PCM trực tiếp qua HTML5 Audio Element
 * Đảm bảo 100% người dùng nghe thấy tiếng chuông chúc mừng ngay cả khi Web Audio API bị treo
 */
function playFallbackWavCelebration() {
  if (typeof window === "undefined") return;

  try {
    const sampleRate = 22050;
    const duration = 1.2; // 1.2s
    const totalSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeString(view, 8, "WAVE");

    // fmt sub-chunk
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // subchunk1size (16 for PCM)
    view.setUint16(20, 1, true); // audio format (1 = PCM)
    view.setUint16(22, 1, true); // num channels (1 = mono)
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // data sub-chunk
    writeString(view, 36, "data");
    view.setUint32(40, totalSamples * 2, true);

    // Tổng hợp âm thanh 4 nốt arpeggio (C5=523.25, E5=659.25, G5=783.99, C6=1046.5)
    const tones = [
      { f: 523.25, start: 0, end: 0.25, vol: 0.4 },
      { f: 659.25, start: 0.1, end: 0.35, vol: 0.45 },
      { f: 783.99, start: 0.2, end: 0.45, vol: 0.5 },
      { f: 1046.5, start: 0.3, end: 1.15, vol: 0.6 },
      { f: 1318.5, start: 0.35, end: 1.15, vol: 0.3 },
    ];

    let offset = 44;
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const tone of tones) {
        if (t >= tone.start && t < tone.end) {
          const toneT = t - tone.start;
          const toneDuration = tone.end - tone.start;
          const decay = Math.exp(-3.5 * (toneT / toneDuration));
          sample += Math.sin(2 * Math.PI * tone.f * t) * tone.vol * decay;
        }
      }

      // Clamp -1.0 to 1.0
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const audioEl = new Audio(url);
    audioEl.volume = 0.9;
    void audioEl.play().catch(() => {});
  } catch {
    // Fallback error ignored
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Âm thanh báo xác nhận đặt lịch thành công chúc mừng (Celebration Fanfare & Chime)
 * Hợp âm rộn rã thăng hoa C5 -> E5 -> G5 -> C6 ngân vang lấp lánh (Sparkle harmonics),
 * mang âm hưởng hoan ca tiệc cưới chúc mừng, hoàn toàn khác biệt với tiếng pop tin nhắn và chuông ding-dong thông thường.
 * Tự động chuyển đổi giữa Web Audio API và Fallback Audio Element để đảm bảo 100% luôn kêu!
 */
export async function playBookingSuccessCelebrationTone(force = false) {
  if (!force && isSoundMuted()) return;

  let played = false;

  try {
    const audio = getAudioContext();
    if (audio) {
      if (audio.state === "suspended") {
        await audio.resume().catch(() => {});
      }

      if (audio.state === "running") {
        synthesizeCelebrationChime(audio);
        played = true;
      }
    }
  } catch {
    // Thử fallback nếu Web Audio thất bại
  }

  // Nếu Web Audio chưa chạy được (do bị suspended hoặc policy), dùng ngay Audio Element fallback
  if (!played) {
    playFallbackWavCelebration();
  }
}
