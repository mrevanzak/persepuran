import type { ApiOutputs } from "@server/routers";
import type { LatLng } from "react-native-maps";

export type Stations = ApiOutputs["train"]["stations"];
export type Routes = ApiOutputs["train"]["routes"];
export type Train = ApiOutputs["train"]["gapeka"][number];
export type TrainStep = Train["paths"][number];

export type ProjectedTrain = {
  id: number;
  code: string;
  name: string;
  start: string;
  end: string;
  position: LatLng;
  moving: boolean;
};

const DAY = 86_400_000;

function normalizeTimeWindow(
  timestamp: number,
  windowStart: number,
  windowEnd: number
) {
  let normalizedStart = windowStart;
  let normalizedEnd = windowEnd;

  if (normalizedEnd < normalizedStart) {
    normalizedStart = windowStart % DAY;
    normalizedEnd = windowEnd % DAY;
    normalizedEnd += DAY;
  }

  const cycle = Math.ceil(normalizedEnd / DAY) * DAY;
  return {
    time_ms: timestamp % cycle,
    start_ms: normalizedStart,
    end_ms: normalizedEnd,
  };
}

function isWithin(now: number, start: number, end: number) {
  const norm = normalizeTimeWindow(now, start, end);
  return norm.start_ms <= norm.time_ms && norm.time_ms <= norm.end_ms;
}

function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
}

function positionOnRoute(route: Routes[string], P: number): LatLng | null {
  const clamped = Math.max(0, Math.min(route.len_cm, P));
  const segment = route.paths.find(
    (path) => path.pos_cm[0] <= clamped && clamped <= path.pos_cm[1]
  );
  if (!segment) return null;

  const segLen = segment.pos_cm[1] - segment.pos_cm[0] || 1;
  const t = (clamped - segment.pos_cm[0]) / segLen;
  return lerp(segment.pos[0], segment.pos[1], t);
}

function pickActiveStep(now: number, steps: TrainStep[]): TrainStep | null {
  return (
    steps.find((step) => isWithin(now, step.start_ms, step.depart_ms)) ?? null
  );
}

export function projectTrain(
  now: number,
  train: Train,
  stations: Stations,
  routes: Routes
): ProjectedTrain | null {
  const { time_ms } = normalizeTimeWindow(now, train.depart_ms, train.arriv_ms);
  const step = pickActiveStep(time_ms, train.paths);
  if (!step) return null;

  if (step.arriv_ms <= time_ms && time_ms <= step.depart_ms) {
    const station = stations[step.st_id];
    if (!station) return null;

    return {
      id: train.tr_id,
      code: train.tr_cd,
      name: train.tr_name,
      start: train.start_st_cd,
      end: train.end_st_cd,
      position: station.coordinates,
      moving: false,
    };
  }

  if (!step.route_id) return null;
  const route = routes[step.route_id];
  if (!route) return null;

  const duration = step.arriv_ms - step.start_ms || 1;
  const cmPerMs = route.len_cm / duration;
  const elapsed = time_ms - step.start_ms;
  const distForward = cmPerMs * elapsed;
  const progress = step.inv_route ? route.len_cm - distForward : distForward;

  const position = positionOnRoute(route, progress);
  if (!position) return null;

  return {
    id: train.tr_id,
    code: train.tr_cd,
    name: train.tr_name,
    start: train.start_st_cd,
    end: train.end_st_cd,
    position,
    moving: true,
  };
}
