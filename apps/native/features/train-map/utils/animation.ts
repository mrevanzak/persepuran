import {
  EASE_CUBIC_HIGH_MULTIPLIER,
  EASE_CUBIC_LOW_MULTIPLIER,
  EASE_HALF,
  MARKER_ANIM_DURATION_MS,
} from "../constants";
import type { LatLng } from "./train-projection";

export function easeInOutCubic(t: number) {
  if (t < EASE_HALF) return EASE_CUBIC_LOW_MULTIPLIER * t * t * t;
  const f = EASE_CUBIC_HIGH_MULTIPLIER * t - EASE_CUBIC_HIGH_MULTIPLIER;
  return EASE_HALF * f * f * f + 1;
}

export function computeNextPositions(
  now: number,
  anims: Map<
    number,
    {
      from: LatLng;
      to: LatLng;
      start: number;
    }
  >,
  currentPositions: Map<number, LatLng>
) {
  let changed = false;
  const nextPositions = new Map(currentPositions);

  for (const [id, anim] of anims) {
    const progress = Math.min(1, (now - anim.start) / MARKER_ANIM_DURATION_MS);
    const t = easeInOutCubic(progress);
    const lat =
      anim.from.latitude + (anim.to.latitude - anim.from.latitude) * t;
    const lng =
      anim.from.longitude + (anim.to.longitude - anim.from.longitude) * t;
    nextPositions.set(id, { latitude: lat, longitude: lng });
    changed = true;
    if (progress >= 1) {
      anims.delete(id);
    }
  }

  return { changed, nextPositions } as const;
}
