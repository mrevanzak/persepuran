import type { ApiOutputs } from "@server/routers";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useCurrentLocation } from "@/lib/use-current-location";
import { orpc } from "@/utils/orpc";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
type Stations = ApiOutputs["train"]["stations"];
type Routes = ApiOutputs["train"]["routes"];
type Train = ApiOutputs["train"]["gapeka"][number];
type TrainStep = Train["paths"][number];
type LatLng = { latitude: number; longitude: number };

type ProjectedTrain = {
  id: number;
  code: string;
  name: string;
  start: string;
  end: string;
  position: LatLng;
  moving: boolean;
};

// -----------------------------------------------------------------------------
// Time helpers
// -----------------------------------------------------------------------------
const DAY = 86_400_000;

function normalizeTimeWindow(
  timestamp: number,
  windowStart: number,
  windowEnd: number
) {
  // Roll end into next day if trip crosses midnight
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

// -----------------------------------------------------------------------------
// Geometry helpers
// -----------------------------------------------------------------------------
function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
}

// Given a route geometry and a progress P (cm from route start), return LatLng
function positionOnRoute(route: Routes[string], P: number): LatLng | null {
  const clamped = Math.max(0, Math.min(route.len_cm, P));
  const seg = route.paths.find(
    (p) => p.pos_cm[0] <= clamped && clamped <= p.pos_cm[1]
  );
  if (!seg) return null;

  const segLen = seg.pos_cm[1] - seg.pos_cm[0] || 1;
  const t = (clamped - seg.pos_cm[0]) / segLen;
  return lerp(seg.pos[0], seg.pos[1], t);
}

// -----------------------------------------------------------------------------
// Core projection logic (reads like English)
// -----------------------------------------------------------------------------
function pickActiveStep(now: number, steps: TrainStep[]): TrainStep | null {
  // Find the step whose window includes "now" (using your mc semantics)
  return steps.find((s) => isWithin(now, s.start_ms, s.depart_ms)) ?? null;
}

function projectTrain(
  now: number,
  train: Train,
  stations: Stations,
  routes: Routes
): ProjectedTrain | null {
  // Normalize "now" into the same domain the client uses
  const { time_ms } = normalizeTimeWindow(now, train.depart_ms, train.arriv_ms);

  const step = pickActiveStep(time_ms, train.paths);
  if (!step) return null;

  // Dwell: snap to station if within [arriv_ms, depart_ms]
  if (step.arriv_ms <= time_ms && time_ms <= step.depart_ms) {
    const st = stations[step.st_id];
    if (!st) return null;
    return {
      id: train.tr_id,
      code: train.tr_cd,
      name: train.tr_name,
      start: train.start_st_cd,
      end: train.end_st_cd,
      position: st.coordinates,
      moving: false,
    };
  }

  // Moving: interpolate along the current route
  if (!step.route_id) return null;
  const route = routes[step.route_id];
  if (!route) return null;

  const duration = step.arriv_ms - step.start_ms || 1; // ms
  const cmPerMs = route.len_cm / duration;
  const elapsed = time_ms - step.start_ms; // ms since leg start
  const distForward = cmPerMs * elapsed; // cm from route start
  const progress = step.inv_route ? route.len_cm - distForward : distForward;

  const pos = positionOnRoute(route, progress);
  if (!pos) return null;

  return {
    id: train.tr_id,
    code: train.tr_cd,
    name: train.tr_name,
    start: train.start_st_cd,
    end: train.end_st_cd,
    position: pos,
    moving: true,
  };
}

export default function HomeScreen() {
  useCurrentLocation();

  const { data: routes } = useQuery(orpc.train.routes.queryOptions());
  const { data: stations } = useQuery(orpc.train.stations.queryOptions());
  const { data: trains } = useQuery(orpc.train.gapeka.queryOptions());

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = 1000;
    const id = setInterval(() => {
      setNow(Date.now());
    }, interval);
    return () => clearInterval(id);
  }, []);

  const liveTrains = useMemo(() => {
    if (!(trains && stations && routes)) {
      return null;
    }

    const projected: ProjectedTrain[] = [];
    for (const t of trains) {
      const p = projectTrain(now, t, stations, routes);
      if (p) {
        projected.push(p);
      }
    }

    return projected;
  }, [routes, stations, trains, now]);

  return (
    <MapView
      followsUserLocation
      mapType="hybridFlyover"
      showsCompass={false}
      showsUserLocation
      style={StyleSheet.absoluteFill}
    >
      {routes &&
        Object.entries(routes).map(([id, route]) => (
          <Polyline
            coordinates={route.coordinates}
            key={id}
            strokeColor="#000"
            strokeWidth={2}
          />
        ))}
      {stations &&
        Object.entries(stations).map(([id, station]) => (
          <Marker
            coordinate={station.coordinates}
            description={station.cd}
            key={id}
            title={station.nm}
            useLegacyPinView
          />
        ))}
      {liveTrains?.map((train) => (
        <Marker
          coordinate={train.position}
          description={train.code}
          key={train.id}
          title={train.name}
        />
      ))}
    </MapView>
  );
}
