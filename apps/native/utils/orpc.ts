import Env from "@env";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { authClient } from "@/lib/auth-client";
import type { AppRouterClient } from "../../server/src/routers";

export const getQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // 1 day
        gcTime: 1000 * 60 * 60 * 24,
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        toast.error(error.message);
        console.error(error);
      },
    }),
  });

export const link = new RPCLink({
  url: `${Env.API_URL}/rpc`,
  headers() {
    const headers = new Map<string, string>();
    const cookies = authClient.getCookie();
    if (cookies) {
      headers.set("Cookie", cookies);
    }
    return Object.fromEntries(headers);
  },
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
