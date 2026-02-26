// Type declaration for expo-file-system
// This module is only available in React Native/Expo environments
// The actual import is guarded at runtime in src/sealed.ts

declare module 'expo-file-system' {
  export const documentDirectory: string | null;
  export function writeAsStringAsync(uri: string, data: string): Promise<void>;
  export function readAsStringAsync(uri: string): Promise<string>;
}
