
declare module "@better-auth/expo/client" {
  export function expoClient(...args: any[]): any;
}

declare module "expo-secure-store" {
  const SecureStore: {
    getItemAsync: (...args: any[]) => Promise<string | null>;
    setItemAsync: (...args: any[]) => Promise<void>;
    deleteItemAsync: (...args: any[]) => Promise<void>;
  };

  export default SecureStore;
}
