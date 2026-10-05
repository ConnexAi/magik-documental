import { applyEmulatorEnv } from "../support/env";
import { seed } from "../emulator/seed";

export default async function globalSetup(): Promise<void> {
  applyEmulatorEnv();
  await seed();
}
