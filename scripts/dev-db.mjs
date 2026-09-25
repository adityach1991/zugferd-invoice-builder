#!/usr/bin/env node
/**
 * Local development PostgreSQL via embedded-postgres (prebuilt binaries;
 * no system install required). Data persists in .dev-db/ (gitignored).
 *
 * Usage:
 *   node scripts/dev-db.mjs start   # initialise (first run) + start server
 *   node scripts/dev-db.mjs stop    # stop server
 *
 * Production and CI use a real PostgreSQL 16+; this is a dev convenience.
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";

const DATABASE_DIR = ".dev-db";
const DATABASE_NAME = "zugferd_dev";
const PORT = 5432;
const USER = "postgres";
const PASSWORD = "postgres";

const command = process.argv[2] ?? "start";

const pg = new EmbeddedPostgres({
  databaseDir: DATABASE_DIR,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,
});

if (command === "start") {
  const firstRun = !existsSync(DATABASE_DIR);
  if (firstRun) {
    console.log("Initialising PostgreSQL data directory (downloads binaries on first run)...");
    await pg.initialise();
  }
  console.log(`Starting PostgreSQL on port ${PORT}...`);
  await pg.start();
  try {
    await pg.createDatabase(DATABASE_NAME);
    console.log(`Created database ${DATABASE_NAME}`);
  } catch (error) {
    if (String(error).includes("already exists")) {
      console.log(`Database ${DATABASE_NAME} already exists`);
    } else {
      throw error;
    }
  }
  console.log(`DATABASE_URL=postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE_NAME}?schema=public`);
  // Keep the process alive so the server keeps running.
  console.log("PostgreSQL is running. Press Ctrl+C to stop.");
  process.on("SIGINT", async () => {
    await pg.stop();
    process.exit(0);
  });
} else if (command === "stop") {
  await pg.stop();
  console.log("PostgreSQL stopped");
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
