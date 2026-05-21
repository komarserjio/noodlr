'use client'

import { useRef, useState } from 'react'

export function useMetronome() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const metronomeRef = useRef<NodeJS.Timeout | null>(null)
  const beatCountRef = useRef(0)
  const [beatType, setBeatType] = useState<'accent' | 'regular' | null>(null)

  function playClick(accented: boolean) {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = accented ? 1200 : 800
    const duration = accented ? 0.06 : 0.04
    const volume = accented ? 1.0 : 0.5
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }

  function start(bpm: number, beatsPerBar: number) {
    stop()
    beatCountRef.current = 0
    const intervalMs = (60 / bpm) * 1000
    const tick = () => {
      const isAccent = beatCountRef.current === 0
      playClick(isAccent)
      setBeatType(isAccent ? 'accent' : 'regular')
      setTimeout(() => setBeatType(null), 100)
      beatCountRef.current = (beatCountRef.current + 1) % beatsPerBar
    }
    tick()
    metronomeRef.current = setInterval(tick, intervalMs)
  }

  function stop() {
    if (metronomeRef.current) {
      clearInterval(metronomeRef.current)
      metronomeRef.current = null
    }
    beatCountRef.current = 0
    setBeatType(null)
  }

  function destroy() {
    stop()
    audioCtxRef.current?.close()
  }

  return { beatType, start, stop, destroy }
}
