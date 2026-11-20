export function createRegionAmbience(region = 'central') {
  if (typeof window === 'undefined') return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0.035;
  master.connect(context.destination);

  const profiles = {
    central: [48, 96],
    academy: [72, 144],
    green: [96, 192],
    innovation: [55, 110],
    commerce: [64, 128],
  };
  const [base, harmonic] = profiles[region] || profiles.central;
  const oscillators = [base, harmonic].map((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.value = index ? 0.08 : 0.12;
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    return oscillator;
  });

  return {
    setRegion(nextRegion) {
      const profile = profiles[nextRegion] || profiles.central;
      oscillators.forEach((oscillator, index) => {
        oscillator.frequency.setTargetAtTime(profile[index] || profile[0], context.currentTime, 0.35);
      });
    },
    stop() {
      oscillators.forEach((oscillator) => oscillator.stop());
      context.close();
    },
  };
}
