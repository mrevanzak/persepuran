import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { orpc } from "@/utils/orpc";
import type {
  ProjectedTrain,
  Routes,
  Stations,
  Train,
} from "../utils/train-projection";
import { projectTrain } from "../utils/train-projection";

function useTicker(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

function projectTrains(
  now: number,
  trains: Train[] | undefined,
  stations: Stations | undefined,
  routes: Routes | undefined
): ProjectedTrain[] | null {
  if (!(trains && stations && routes)) {
    return null;
  }

  const acc: ProjectedTrain[] = [];
  for (const train of trains) {
    const projected = projectTrain(now, train, stations, routes);
    if (projected) {
      acc.push(projected);
    }
  }

  return acc;
}

const DefaultRefreshIntervalMs = 1000;
export function useTrainMapData(options?: { refreshIntervalMs?: number }) {
  const refreshIntervalMs =
    options?.refreshIntervalMs ?? DefaultRefreshIntervalMs;
  const now = useTicker(refreshIntervalMs);

  const { data: routes } = useQuery(orpc.train.routes.queryOptions());
  const { data: stations } = useQuery(orpc.train.stations.queryOptions());
  const { data: trains } = useQuery(orpc.train.gapeka.queryOptions());

  const liveTrains = useMemo(
    () => projectTrains(now, trains, stations, routes),
    [now, routes, stations, trains]
  );

  return {
    routes,
    stations,
    liveTrains,
  };
}
