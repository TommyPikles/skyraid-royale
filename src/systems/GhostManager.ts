import type { GhostFrame } from '../types';
import { GHOST } from '../config/balance';
import { progression } from './ProgressionManager';

/**
 * Records the player's best-run Y-position over time, then plays it back as a
 * translucent "ghost" rival on future runs. Pure client-side.
 */
class GhostManager {
  private recording: GhostFrame[] = [];
  private recordingStartMs = 0;
  private lastSampleMs = 0;

  private playback: GhostFrame[] | null = null;
  private playbackIndex = 0;

  startRecording(nowMs: number): void {
    this.recording = [];
    this.recordingStartMs = nowMs;
    this.lastSampleMs = nowMs;

    const best = progression.state.ghostBestPath;
    this.playback = best && best.length > 0 ? best : null;
    this.playbackIndex = 0;
  }

  sample(nowMs: number, y: number, v: number): void {
    if (nowMs - this.lastSampleMs < GHOST.sampleIntervalMs) return;
    this.lastSampleMs = nowMs;
    this.recording.push({ t: nowMs - this.recordingStartMs, y, v });
  }

  getRecording(): GhostFrame[] {
    return this.recording.slice();
  }

  hasPlayback(): boolean {
    return this.playback !== null && this.playback.length > 1;
  }

  /**
   * Returns the ghost's interpolated Y at the given elapsed ms, or null if the
   * ghost's recording has ended (meaning the player has survived beyond it).
   */
  ghostYAt(elapsedMs: number): number | null {
    const path = this.playback;
    if (!path || path.length < 2) return null;
    if (elapsedMs > path[path.length - 1].t) return null;

    // Advance index forward.
    while (
      this.playbackIndex < path.length - 1 &&
      path[this.playbackIndex + 1].t < elapsedMs
    ) {
      this.playbackIndex += 1;
    }
    const a = path[this.playbackIndex];
    const b = path[Math.min(this.playbackIndex + 1, path.length - 1)];
    if (a === b) return a.y;
    const span = Math.max(1, b.t - a.t);
    const f = Math.min(1, Math.max(0, (elapsedMs - a.t) / span));
    return a.y + (b.y - a.y) * f;
  }
}

export const ghosts = new GhostManager();
