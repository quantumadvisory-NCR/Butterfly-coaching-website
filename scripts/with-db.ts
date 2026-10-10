/**
 * Runs a command with a database available.
 *
 * Local mode (BCA_LOCAL_MODE=1): starts an embedded PostgreSQL server in
 * .local/pg if one is not already listening, applies migrations, seeds an
 * empty database, then runs the command. Supabase mode: runs the command
 * as-is against DATABASE_URL.
 *
 *   tsx scripts/with-db.ts next dev
 *   tsx scripts/with-db.ts --hold      keep the local database running
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { loadEnv, LOCAL_DB } from "./env";

loadEnv();

const rawArgs = process.argv.slice(2);
// --db=<name> runs against a separate local database (used by the end-to-end tests).
const dbFlag = rawArgs.find((arg) => arg.startsWith("--db="));
const dbName = dbFlag ? dbFlag.slice(5).replace(/[^a-z0-9_]/gi, "") : LOCAL_DB.database;
const args = rawArgs.filter((arg) => arg !== dbFlag);
const hold = args[0] === "--hold";
const withDatabase = (name: string) => `${LOCAL_DB.url.slice(0, LOCAL_DB.url.lastIndexOf("/"))}/${name}`;
const localUrl = withDatabase(dbName);
const isLocal = process.env.BCA_LOCAL_MODE === "1";

function portOpen(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    socket.setTimeout(800);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    const fail = () => {
      socket.destroy();
      resolve(false);
    };
    socket.once("error", fail);
    socket.once("timeout", fail);
  });
}

/** True when a PostgreSQL server on the local port answers a query. */
async function dbResponds(): Promise<boolean> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(withDatabase("postgres"), { max: 1, connect_timeout: 3, onnotice: () => {} });
  try {
    await sql`select 1`;
    return true;
  } catch {
    return false;
  } finally {
    await sql.end({ timeout: 1 }).catch(() => {});
  }
}

/**
 * On Windows, killing the local server outright (closing its terminal, for
 * example) can leave one of its workers running and holding the port. This ends
 * such leftovers: only this project's own embedded PostgreSQL, and only
 * processes whose parent server has already gone.
 */
function endOrphanedLocalDb() {
  if (process.platform !== "win32") return;
  const script =
    "Get-CimInstance Win32_Process -Filter \"Name='postgres.exe'\" | " +
    "Where-Object { $_.CommandLine -and $_.CommandLine.Replace('\\','/').Contains($env:BCA_PG_BIN) -and -not (Get-Process -Id $_.ParentProcessId -ErrorAction SilentlyContinue) } | " +
    "ForEach-Object { Stop-Process -Id $_.ProcessId -Force }";
  spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", script], {
    stdio: "ignore",
    env: { ...process.env, BCA_PG_BIN: path.resolve("node_modules/@embedded-postgres").replace(/\\/g, "/") },
  });
}

type Stoppable = { stop: () => Promise<void> };

async function startLocalDb(): Promise<Stoppable | null> {
  // An open port is not proof of a working server: one that is still shutting
  // down, or a worker left behind by a killed server, keeps the port for a while.
  for (let attempt = 0; attempt < 10 && (await portOpen(LOCAL_DB.port)); attempt++) {
    if (await dbResponds()) return null;
    if (attempt === 2) endOrphanedLocalDb();
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  if (await portOpen(LOCAL_DB.port)) {
    throw new Error(
      `Port ${LOCAL_DB.port} is held by a PostgreSQL process that is not responding. End any leftover postgres processes, then try again.`,
    );
  }

  const { default: EmbeddedPostgres } = await import("embedded-postgres");
  const databaseDir = path.resolve(".local/pg");
  const fresh = !existsSync(path.join(databaseDir, "PG_VERSION"));
  if (fresh) mkdirSync(databaseDir, { recursive: true });

  const pg = new EmbeddedPostgres({
    databaseDir,
    user: LOCAL_DB.user,
    password: LOCAL_DB.password,
    port: LOCAL_DB.port,
    persistent: true,
    // Match Supabase: UTF-8 everywhere. Without this, initdb on Windows picks WIN1252.
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    onLog: () => {},
    onError: (message) => {
      const text = String(message ?? "");
      if (/FATAL|PANIC/.test(text)) console.error(`[local-db] ${text}`);
    },
  });

  if (fresh) await pg.initialise();
  await pg.start();
  console.log(`[local-db] PostgreSQL running on 127.0.0.1:${LOCAL_DB.port}`);
  return pg;
}

/** Creates the database on first use. */
async function ensureDatabase(name: string) {
  const { default: postgres } = await import("postgres");
  const admin = postgres(withDatabase("postgres"), { max: 1, onnotice: () => {} });
  try {
    const existing = await admin`select 1 from pg_database where datname = ${name}`;
    if (existing.length === 0) await admin.unsafe(`create database "${name}" encoding 'UTF8' template template0`);
  } finally {
    await admin.end();
  }
}

function run(command: string[]): Promise<number> {
  return new Promise((resolve) => {
    const binDir = path.resolve("node_modules/.bin");
    const env = {
      ...process.env,
      PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ""}`,
    };
    // The command runs through the shell (npm bin shims need it on Windows), so quote anything it would misread.
    const quote = (arg: string) => (/[\s|&<>^()"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg);
    const child = spawn(command.map(quote).join(" "), { stdio: "inherit", shell: true, env });
    child.on("exit", (code) => resolve(code ?? 0));
  });
}

async function main() {
  let server: Stoppable | null = null;

  if (isLocal) {
    process.env.DATABASE_URL = localUrl;
    server = await startLocalDb();
    try {
      await ensureDatabase(dbName);
      const { migrate } = await import("./migrate");
      await migrate();
      const { seedIfEmpty } = await import("./seed");
      await seedIfEmpty();
    } catch (error) {
      // Never leave an orphaned database server behind if setup fails.
      if (server) await server.stop().catch(() => {});
      throw error;
    }
  } else if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set. Add your Supabase connection string to .env.local, or set BCA_LOCAL_MODE=1 for the built-in local database.",
    );
    process.exit(1);
  }

  const shutdown = async (code: number) => {
    if (server) await server.stop().catch(() => {});
    process.exit(code);
  };
  process.on("SIGINT", () => void shutdown(130));
  process.on("SIGTERM", () => void shutdown(143));

  if (hold) {
    console.log("[local-db] Holding. Press Ctrl+C to stop.");
    await new Promise(() => {});
    return;
  }
  if (args.length === 0) {
    await shutdown(0);
    return;
  }
  const code = await run(args);
  await shutdown(code);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
