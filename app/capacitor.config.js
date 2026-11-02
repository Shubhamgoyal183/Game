// Capacitor settings. Native Google login plugin tabhi jodte hain jab google-services.json ho,
// warna Firebase initialize na hone se app khulte hi crash ho jaati.
const fs = require("fs");
const path = require("path");
const hasGoogleServices = fs.existsSync(path.join(__dirname, "android", "app", "google-services.json"));

module.exports = {
  appId: "com.shubhamgoyal.gamezone",
  appName: "Game Zone",
  webDir: "www",
  android: {
    backgroundColor: "#0b0c1d",
    allowMixedContent: false,
    includePlugins: [
      "@capacitor/app",
      "@capacitor/splash-screen",
      "@capacitor/status-bar",
      ...(hasGoogleServices ? ["@capacitor-firebase/authentication"] : []),
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: false,
      backgroundColor: "#0b0c1d",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: { style: "DARK", backgroundColor: "#0b0c1d", overlaysWebView: false },
    FirebaseAuthentication: { skipNativeAuth: true, providers: ["google.com"] },
  },
};
