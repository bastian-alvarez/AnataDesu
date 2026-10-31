// Original synthesized cues. Nothing is downloaded; sound requires an explicit click.
const cues = {
  select: [[440,0,.09],[660,.05,.1]],
  discovery: [[330,0,.2],[440,.12,.22],[660,.24,.3]],
  tension: [[110,0,.22],[110,.3,.22],[147,.6,.3]],
  danger: [[90,0,.18],[73,.18,.2],[55,.4,.35]],
  loss: [[330,0,.5],[294,.3,.55],[220,.65,.8]],
  rescue: [[262,0,.22],[330,.12,.26],[392,.24,.4]],
  victory: [[262,0,.5],[330,.13,.6],[392,.26,.65],[523,.5,.8]],
  quiet: [[392,0,.12]],
};
export function createStoryAudio(environment = globalThis) {
  let context;
  let enabled = false;
  let volume = .3;
  const active = new Set();
  function stop() { for (const oscillator of active) { try { oscillator.stop(); } catch { /* Already ended. */ } } active.clear(); }
  function disable() { enabled = false; stop(); }
  async function enable() {
    try {
      const Audio = environment.AudioContext || environment.webkitAudioContext;
      if (!Audio) return false;
      context ||= new Audio();
      if (context.state === 'suspended') await context.resume();
      enabled = context.state === 'running';
      return enabled;
    } catch { disable(); return false; }
  }
  function play(cue = 'select') {
    if (!enabled || !context || context.state !== 'running') return false;
    stop();
    try {
      const notes = cues[cue] || cues.select;
      for (const [frequency, offset, duration] of notes) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const at = context.currentTime + offset;
        oscillator.type = cue === 'danger' || cue === 'tension' ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(volume * .12, at + .025);
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        oscillator.connect(gain); gain.connect(context.destination);
        active.add(oscillator);
        oscillator.onended = () => { active.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(at); oscillator.stop(at + duration + .05);
      }
      return true;
    } catch { disable(); return false; }
  }
  return { enable, disable, play, stop, get enabled() { return enabled; }, get volume() { return volume; }, setVolume(value) { if (Number.isFinite(value)) volume = Math.max(0, Math.min(1, value)); } };
}
