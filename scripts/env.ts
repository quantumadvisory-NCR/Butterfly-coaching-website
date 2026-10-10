import { config } from "dotenv";
import { LOCAL_DATABASE_URL } from "../src/lib/env";

/** Connection details for the embedded development database. */
export const LOCAL_DB = {
  user: "postgres",
  password: "postgres",
  port: 54329,
  database: "bca",
  url: LOCAL_DATABASE_URL,
};

let loaded = false;

/** Loads .env.local then .env, the same precedence Next.js uses. */
export function loadEnv() {
  if (loaded) return;
  loaded = true;
  config({ path: [".env.local", ".env"], quiet: true });
  if (process.env.BCA_LOCAL_MODE === "1" && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = LOCAL_DATABASE_URL;
  }
}
