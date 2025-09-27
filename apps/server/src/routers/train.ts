import { env } from "cloudflare:workers";
import { publicProcedure } from "@/lib/orpc";

type LatLng = { latitude: number; longitude: number };
function toLatLng(tuple: [number, number]): LatLng {
  return { latitude: tuple[0], longitude: tuple[1] };
}

// Type-only DTOs for KV-backed JSON data
type StationDto = {
  cd: string;
  nm: string;
  pos: [number, number];
  st_id: number;
};

type RoutePathDto = {
  pos: [[number, number], [number, number]];
  pos_cm: [number, number];
};

type RouteDto = {
  route_id: number;
  len_cm: number;
  paths: RoutePathDto[];
};

type GapekaPathDto = {
  arriv_ms: number;
  depart_ms: number;
  inv_route: boolean;
  org_st_cd: string;
  org_st_id: number;
  route_id: number | null;
  st_cd: string;
  st_id: number;
  start_ms: number;
  usr_arriv: string | null;
  usr_depart: string | null;
  usr_note: string | null;
};

type GapekaDto = {
  arriv_ms: number;
  depart_ms: number;
  mod_day_ms: number;
  start_st_cd: string;
  end_st_cd: string;
  tr_cd: string;
  tr_id: number;
  tr_name: string;
  paths: GapekaPathDto[];
};

export const trainRouter = {
  stations: publicProcedure.handler(async () => {
    const rawStations = await env.KV.get("stations", "json");
    const stations =
      ((rawStations as { data?: unknown } | null)?.data as
        | StationDto[]
        | undefined) ?? [];

    return Object.fromEntries(
      stations.map((s) => [
        s.st_id,
        {
          cd: s.cd,
          nm: s.nm,
          coordinates: toLatLng([s.pos[0], s.pos[1]]),
        },
      ])
    );
  }),
  routes: publicProcedure.handler(async () => {
    const rawRoutes = await env.KV.get("routes", "json");
    const routes =
      ((rawRoutes as { data?: unknown } | null)?.data as
        | RouteDto[]
        | undefined) ?? [];

    return Object.fromEntries(
      routes.map((r) => {
        const coordinates: LatLng[] = [];
        for (const segment of r.paths) {
          const [start, end] = segment.pos;

          if (coordinates.length) {
            const last = coordinates[coordinates.length - 1];

            if (last.latitude !== start[0] || last.longitude !== start[1]) {
              coordinates.push({ latitude: start[0], longitude: start[1] });
            }
          } else {
            coordinates.push({ latitude: start[0], longitude: start[1] });
          }

          coordinates.push({ latitude: end[0], longitude: end[1] });
        }

        return [
          r.route_id,
          {
            len_cm: r.len_cm,
            paths: r.paths.map((p) => ({
              pos: [toLatLng(p.pos[0]), toLatLng(p.pos[1])],
              pos_cm: p.pos_cm,
            })),
            coordinates,
          },
        ];
      })
    );
  }),
  gapeka: publicProcedure.handler(async () => {
    const rawGapeka = await env.KV.get("gapeka", "json");
    return (
      ((rawGapeka as { data?: unknown } | null)?.data as
        | GapekaDto[]
        | undefined) ?? []
    );
  }),
};
