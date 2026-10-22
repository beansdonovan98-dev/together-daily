import type { ExpoConfig } from "expo/config";

/**
 * Static build configuration. This stays executable only because Expo expects
 * app.config.ts in the original mobile template, but it has no imports,
 * environment branching, or computed values for EAS to evaluate.
 */
const config: ExpoConfig = {
  name: "Together Daily",
  slug: "together-daily",
  version: "1.0.16",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "manusogetherdaily",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  extra: {
    eas: {
      projectId: "193e4767-6636-4cc4-abd7-1c6d75e06f4b",
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.app.togetherdaily",
    buildNumber: "100",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription:
        "Together Daily uses your photo library so you can privately share cover photos and memories with your partner.",
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: "com.app.togetherdaily",
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "manusogetherdaily", host: "*" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    ["expo-router", { root: "./app" }],
    "expo-web-browser",
    [
      "expo-font",
      {
        fonts: [
          "./assets/fonts/Kalam-Regular.ttf",
          "./assets/fonts/PatrickHand-Regular.ttf",
          "./assets/fonts/Caveat-Variable.ttf",
          "./assets/fonts/Bangers-Regular.ttf",
          "./assets/fonts/CourierPrime-Regular.ttf",
        ],
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow $(PRODUCT_NAME) to access your photos so you can share private memories and daily cover photos.",
      },
    ],
    [
      "expo-audio",
      { microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone." },
    ],
    [
      "expo-video",
      { supportsBackgroundPlayback: true, supportsPictureInPicture: true },
    ],
    ["expo-notifications", { color: "#8D5BA6", defaultChannel: "together-daily" }],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
    [
      "expo-build-properties",
      { android: { buildArchs: ["armeabi-v7a", "arm64-v8a"], minSdkVersion: 24 } },
    ],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
};

export default config;
