import type { ChildProcess } from "node:child_process";
import { applyEmulatorEnv } from "./env";
import { seed } from "../emulator/seed";
import { startTestServer, stopTestServer } from "./server";

let server: ChildProcess | undefined;

export async function setup(): Promise<void> {
  applyEmulatorEnv();
  await seed();
  server = await startTestServer();
}

export async function teardown(): Promise<void> {
  stopTestServer(server);
}
