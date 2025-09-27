import { expoClient } from "@better-auth/expo/client";
import Env from "@env";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: Env.API_URL,
  plugins: [
    expoClient({
      scheme: "mybettertapp",
      storagePrefix: "persepuran",
      storage: SecureStore,
    }),
  ],
});
