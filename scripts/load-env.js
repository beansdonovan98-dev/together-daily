const fs = require("fs");
const path = require("path");

/**
 * Loads optional local environment values without overriding the environment
 * injected by Expo/EAS or the hosting platform. CommonJS keeps this side-effect
 * module compatible with Expo config evaluation in local and remote builds.
 */
const envPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");

  for (const line of envContent.split("\n")) {
    if (!line || line.trim().startsWith("#")) continue;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;

    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const mappings = {
  VITE_APP_ID: "EXPO_PUBLIC_APP_ID",
  VITE_OAUTH_PORTAL_URL: "EXPO_PUBLIC_OAUTH_PORTAL_URL",
  OAUTH_SERVER_URL: "EXPO_PUBLIC_OAUTH_SERVER_URL",
  OWNER_OPEN_ID: "EXPO_PUBLIC_OWNER_OPEN_ID",
  OWNER_NAME: "EXPO_PUBLIC_OWNER_NAME",
};

for (const [systemVariable, expoVariable] of Object.entries(mappings)) {
  if (process.env[systemVariable] && !process.env[expoVariable]) {
    process.env[expoVariable] = process.env[systemVariable];
  }
}
