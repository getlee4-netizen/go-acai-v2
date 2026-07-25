let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime)
    gain.gain.setValueAtTime(volume, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration)
  } catch { }
}

export function playOrderReceived() {
  playTone(523, 0.15, 'sine')
  setTimeout(() => playTone(659, 0.15, 'sine'), 150)
  setTimeout(() => playTone(784, 0.25, 'sine'), 300)
}

export function playPreparing() {
  playTone(440, 0.15, 'triangle')
  setTimeout(() => playTone(587, 0.2, 'triangle'), 200)
}

export function playShipped() {
  playTone(392, 0.15, 'sawtooth')
  setTimeout(() => playTone(523, 0.15, 'sawtooth'), 180)
  setTimeout(() => playTone(659, 0.2, 'sawtooth'), 360)
}

export function playDelivered() {
  playTone(784, 0.1, 'sine')
  setTimeout(() => playTone(988, 0.1, 'sine'), 100)
  setTimeout(() => playTone(1175, 0.3, 'sine'), 200)
}

export function playNewOrder() {
  playTone(880, 0.08, 'square')
  setTimeout(() => playTone(880, 0.08, 'square'), 250)
  setTimeout(() => playTone(1175, 0.2, 'sine'), 500)
}

export function playStatusChange(status: string) {
  switch (status) {
    case 'pending': return playOrderReceived()
    case 'preparing': return playPreparing()
    case 'out_for_delivery': return playShipped()
    case 'delivered': return playDelivered()
    default: playTone(600, 0.1, 'sine')
  }
}
