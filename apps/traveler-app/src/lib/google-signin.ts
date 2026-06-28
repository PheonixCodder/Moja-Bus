import { GoogleSignin } from "@react-native-google-signin/google-signin";

let isConfigured = false;

export function configureGoogleSignIn() {
  if (isConfigured) {
    return;
  }

  const webClientId = process.env["EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"];
  const iosClientId = process.env["EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID"];

  if (!webClientId) {
    return;
  }

  GoogleSignin.configure({
    webClientId,
    iosClientId,
    offlineAccess: false,
  });

  isConfigured = true;
}
