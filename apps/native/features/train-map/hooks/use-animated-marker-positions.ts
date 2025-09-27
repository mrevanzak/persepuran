import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EPSILON_COORD_DIFF } from "../constants";
import { computeNextPositions } from "../utils/animation";
import type { LatLng, ProjectedTrain } from "../utils/train-projection";

export function useAnimatedMarkerPositions(
  liveTrains: ProjectedTrain[] | null
) {
  const positionsRef = useRef<Map<number, LatLng>>(new Map());
  const animationsRef = useRef<
    Map<
      number,
      {
        from: LatLng;
        to: LatLng;
        start: number;
      }
    >
  >(new Map());
  const rafRef = useRef<number | null>(null);
  const [version, setVersion] = useState(0);

  const scheduleRaf = useCallback(() => {
    if (rafRef.current != null) return;
    const tick = () => {
      const now = Date.now();
      const anims = animationsRef.current;
      if (anims.size === 0) {
        rafRef.current = null;
        return;
      }
      const { changed, nextPositions } = computeNextPositions(
        now,
        anims,
        positionsRef.current
      );
      if (changed) {
        positionsRef.current = nextPositions;
        setVersion((v) => v + 1);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    },
    []
  );

  const upsertTrainAnimation = useCallback(
    (trainId: number, target: LatLng) => {
      const current = positionsRef.current.get(trainId) ?? target;
      const dLat = Math.abs(current.latitude - target.latitude);
      const dLng = Math.abs(current.longitude - target.longitude);
      if (dLat < EPSILON_COORD_DIFF && dLng < EPSILON_COORD_DIFF) {
        if (!positionsRef.current.has(trainId)) {
          positionsRef.current.set(trainId, target);
          setVersion((v) => v + 1);
        }
        return;
      }
      animationsRef.current.set(trainId, {
        from: current,
        to: target,
        start: Date.now(),
      });
    },
    []
  );

  const pruneMissingTrains = useCallback((seen: Set<number>) => {
    let changed = false;
    for (const id of Array.from(positionsRef.current.keys())) {
      if (!seen.has(id)) {
        positionsRef.current.delete(id);
        animationsRef.current.delete(id);
        changed = true;
      }
    }
    if (changed) setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!liveTrains) return;
    const seen = new Set<number>();
    for (const train of liveTrains) {
      seen.add(train.id);
      upsertTrainAnimation(train.id, train.position);
    }
    pruneMissingTrains(seen);
    scheduleRaf();
  }, [liveTrains, pruneMissingTrains, scheduleRaf, upsertTrainAnimation]);

  const getPosition = useCallback(
    (id: number, fallback: LatLng): LatLng =>
      positionsRef.current.get(id) ?? fallback,
    []
  );

  return useMemo(() => ({ version, getPosition }), [version, getPosition]);
}
