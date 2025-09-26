import { ORPCError } from "@orpc/client";
import z from "zod";
import { publicProcedure } from "@/lib/orpc";

const API_URL = "https://gapeka2025.com/api/v1";

type LatLng = { latitude: number; longitude: number };
function toLatLng(tuple: [number, number]): LatLng {
  return { latitude: tuple[0], longitude: tuple[1] };
}

export const trainRouter = {
  stations: publicProcedure.handler(async () => {
    const response = await fetch(`${API_URL}/public-station/stations`);

    if (!response.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    const json = await response.json();

    const dto = z.object({
      cd: z.string(),
      nm: z.string(),
      pos: z.tuple([z.number(), z.number()]),
      st_id: z.number(),
    });

    const stations = dto.array().parse(json.data);
    return Object.fromEntries(
      stations.map((s) => [
        s.st_id,
        {
          cd: s.cd,
          nm: s.nm,
          coordinates: toLatLng(s.pos),
        },
      ])
    );
  }),
  routes: publicProcedure.handler(async () => {
    const response = await fetch(`${API_URL}/public-route/route-path`);

    if (!response.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    const json = await response.json();

    const dto = z.object({
      route_id: z.number(),
      len_cm: z.number(),
      paths: z.array(
        z.object({
          pos: z.tuple([
            z.tuple([z.number(), z.number()]),
            z.tuple([z.number(), z.number()]),
          ]),
          pos_cm: z.tuple([z.number(), z.number()]),
        })
      ),
    });

    const routes = dto.array().parse(json.data);
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
    const response = await fetch(`${API_URL}/public-train/gapeka`);

    if (!response.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    const json = await response.json();

    const dto = z.object({
      arriv_ms: z.number(),
      depart_ms: z.number(),
      mod_day_ms: z.number(),
      start_st_cd: z.string(),
      end_st_cd: z.string(),
      tr_cd: z.string(),
      tr_id: z.number(),
      tr_name: z.string(),
      paths: z.array(
        z.object({
          arriv_ms: z.number(),
          depart_ms: z.number(),
          inv_route: z.boolean(),
          org_st_cd: z.string(),
          org_st_id: z.number(),
          route_id: z.number().nullable(),
          st_cd: z.string(),
          st_id: z.number(),
          start_ms: z.number(),
          usr_arriv: z.string().nullable(),
          usr_depart: z.string().nullable(),
          usr_note: z.string().nullable(),
        })
      ),
    });

    const routes = dto.array().parse(json.data);
    return routes;
  }),
};
