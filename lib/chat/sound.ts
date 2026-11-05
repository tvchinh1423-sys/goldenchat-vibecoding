let context: AudioContext | undefined;

export function playChatTone() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const audio = (context ??= new AudioContextClass());
    // The first call comes from a click or submit, allowing later bot replies to play.
    if (audio.state === "suspended") void audio.resume().catch(() => {});
    const now = audio.currentTime;
    const tone = audio.createOscillator();
    const volume = audio.createGain();
    tone.frequency.setValueAtTime(784, now);
    tone.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12);
    volume.gain.setValueAtTime(0.07, now);
    volume.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    tone.connect(volume).connect(audio.destination);
    tone.onended = () => {
      tone.disconnect();
      volume.disconnect();
    };
    tone.start();
    tone.stop(now + 0.22);
  } catch {
    // Audio availability does not affect the chat.
  }
}
