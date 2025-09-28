// @ts-nocheck
/*
 * This file should not be modified; use `env.js` in the project root to add your client environment variables.
 * If you import `Env` from `@env`, this is the file that will be loaded.
 * You can only access the client environment variables here.
 * NOTE: We use js file so we can load the client env types
 */

import Constants from "expo-constants";
import { ClientEnv } from "@/env";

/**
 *  @type {typeof import('../../env').ClientEnv}
 */
const Env =
  ClientEnv.APP_ENV === "development"
    ? ClientEnv
    : (Constants.expoConfig?.extra ?? {});
export default Env;
