import { spawn } from "node:child_process";

let child = null;
let stopping = false;

function startMetro() {
  if (stopping) return;
  const port = process.env.EXPO_PORT || "8081";
  child = spawn(
    "npx",
    ["expo", "start", "--web", "--port", port],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CI: "1",
        EXPO_USE_METRO_WORKSPACE_ROOT: "1",
      },
      stdio: "inherit",
    },
  );

  child.on("exit", (code, signal) => {
    child = null;
    if (stopping) process.exit(code ?? 0);
    console.warn(
      `[metro-supervisor] Metro exited (${signal ?? code ?? "unknown"}); restarting in 1 second.`,
    );
    setTimeout(startMetro, 1_000);
  });
}

function stop() {
  stopping = true;
  if (child) child.kill("SIGTERM");
  else process.exit(0);
}

process.on("SIGTERM", stop);
process.on("SIGINT", stop);
startMetro();
