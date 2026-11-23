export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const remainingSecs = s % 60;
  return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
}

export function calculateEstimatedSeconds(wordCount: number, targetWpm: number): number {
  if (targetWpm <= 0) return 0;
  return Math.round((wordCount / targetWpm) * 60);
}

export function calculateCurrentWpm(currentWordIndex: number, elapsedSeconds: number): number {
  if (elapsedSeconds < 2) return 0;
  return Math.round((currentWordIndex / elapsedSeconds) * 60);
}

export function calculatePacingDelta(
  currentWordIndex: number,
  elapsedSeconds: number,
  targetWpm: number
): { secondsDelta: number; label: string } {
  if (targetWpm <= 0 || elapsedSeconds < 2) {
    return { secondsDelta: 0, label: 'ON TRACK' };
  }

  // Target word count expected by this elapsed time
  const expectedWords = (elapsedSeconds / 60) * targetWpm;
  const wordDiff = currentWordIndex - expectedWords;
  // Convert word difference to seconds
  const secondsDelta = Math.round((wordDiff / targetWpm) * 60);

  if (Math.abs(secondsDelta) < 5) {
    return { secondsDelta: 0, label: 'ON TRACK' };
  } else if (secondsDelta > 0) {
    return { secondsDelta, label: `+${secondsDelta}s AHEAD` };
  } else {
    return { secondsDelta, label: `${secondsDelta}s BEHIND` };
  }
}
