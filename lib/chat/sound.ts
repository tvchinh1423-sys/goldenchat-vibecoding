/**
 * Web Audio API Sound Generator for OmniChat AI
 * Tự động tổng hợp âm thanh bằng Web Audio API, không cần tải file .mp3 bên ngoài
 */

let context: AudioContext | undefined;

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
    // Bỏ qua lỗi localStorage nếu có
  }
}

/**
 * Âm thanh gửi/nhận tin nhắn (Chat Tone - nốt Sol5 -> Do6)
 */
export function playChatTone(force = false) {
  if (!force && isSoundMuted()) return;

  try {
    const audio = getAudioContext();
    if (!audio) return;
    if (audio.state === "suspended") void audio.resume().catch(() => {});

    const now = audio.currentTime;
    const tone = audio.createOscillator();
    const volume = audio.createGain();

    tone.frequency.setValueAtTime(784, now); // G5
    tone.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6

    volume.gain.setValueAtTime(0.08, now);
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
 * Thích hợp cho thông báo có tin nhắn mới, lịch hẹn mới, hoặc chuông thông báo web
 */
export function playNotificationChime(force = false) {
  if (!force && isSoundMuted()) return;

  try {
    const audio = getAudioContext();
    if (!audio) return;
    if (audio.state === "suspended") void audio.resume().catch(() => {});

    const now = audio.currentTime;

    // Nốt 1: Ding (E5 - 659.25Hz)
    const osc1 = audio.createOscillator();
    const gain1 = audio.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
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
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2).connect(audio.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch {
    // Audio availability does not break the app
  }
}

/**
 * Âm thanh báo xác nhận đặt lịch thành công chúc mừng (Celebration Fanfare & Chime)
 * Hợp âm rộn rã thăng hoa C5 -> E5 -> G5 -> C6 ngân vang lấp lánh (Sparkle harmonics),
 * mang âm hưởng hoan ca tiệc cưới chúc mừng, hoàn toàn khác biệt với tiếng pop tin nhắn và chuông ding-dong thông báo thường.
 */
export function playBookingSuccessCelebrationTone(force = false) {
  if (!force && isSoundMuted()) return;

  try {
    const audio = getAudioContext();
    if (!audio) return;
    if (audio.state === "suspended") void audio.resume().catch(() => {});

    const now = audio.currentTime;

    // Chuỗi 4 nốt arpeggio vút cao: Đô 5 (523.25) -> Mi 5 (659.25) -> Sol 5 (783.99) -> Đô 6 (1046.5)
    const notes = [
      { freq: 523.25, start: 0, duration: 0.22, vol: 0.12 },
      { freq: 659.25, start: 0.08, duration: 0.22, vol: 0.14 },
      { freq: 783.99, start: 0.16, duration: 0.25, vol: 0.16 },
      { freq: 1046.5, start: 0.25, duration: 0.65, vol: 0.20 },
      // Âm bội lấp lánh (Sparkle overtone) tạo hiệu ứng chuông vàng pha lê chúc mừng
      { freq: 1318.51, start: 0.28, duration: 0.60, vol: 0.10 }, // Mi 6
    ];

    notes.forEach((n) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();

      osc.type = "sine";
      const noteStart = now + n.start;
      const noteEnd = noteStart + n.duration;

      osc.frequency.setValueAtTime(n.freq, noteStart);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.linearRampToValueAtTime(n.vol, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      osc.connect(gain).connect(audio.destination);
      osc.start(noteStart);
      osc.stop(noteEnd);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
  } catch {
    // Audio availability does not break the app
  }
}
