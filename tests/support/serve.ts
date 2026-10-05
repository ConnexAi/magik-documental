// Servidor de pruebas en primer plano, usado por Playwright (webServer).
// Compila en .next-test con el entorno del emulador y arranca next start.
import { spawn } from "node:child_process";
import { TEST_PORT } from "./env";
import { buildTestServer, testServerEnv } from "./server";

const env = testServerEnv();
if (process.env.TEST_SKIP_BUILD !== "1") buildTestServer(env);

const child = spawn("npx", ["next", "start", "-p", String(TEST_PORT)], { env, stdio: "inherit" });
const stop = () => child.kill("SIGTERM");
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
child.on("exit", (code) => process.exit(code ?? 0));
