declare module "better-auth/react" {
  export function createAuthClient(...args: any[]): any;
}

declare module "better-auth/client/plugins" {
  export function emailOTPClient(...args: any[]): any;
}

declare module "@better-auth/expo/client" {
  export function expoClient(...args: any[]): any;
}

declare module "@react-native-google-signin/google-signin" {
  export const GoogleSignin: {
    configure: (...args: any[]) => void;
    hasPlayServices: (...args: any[]) => Promise<void>;
    signIn: (...args: any[]) => Promise<any>;
  };

  export function isSuccessResponse(value: any): boolean;
}

declare module "expo-secure-store" {
  const SecureStore: {
    getItemAsync: (...args: any[]) => Promise<string | null>;
    setItemAsync: (...args: any[]) => Promise<void>;
    deleteItemAsync: (...args: any[]) => Promise<void>;
  };

  export default SecureStore;
}
