# Expo SDK 57 development note

Expo's official changelog states that Expo Go users must be signed in to both the Expo CLI and the Expo Go app to run SDK 57 projects in development mode: https://expo.dev/changelog/expo-go-57-login

TokFuel was upgraded to Expo SDK 57. The project-side migration is complete: dependencies were aligned, dynamic config plugins were added, Expo Router imports were migrated from external `@react-navigation/*` entry points to Expo Router SDK 57 entry points, Metro was restarted successfully, and TypeScript/tests pass. The remaining Expo Go sign-in step must be completed by the developer on the computer and in the Expo Go mobile app; it cannot be performed by the app code.

Expo's SDK compatibility page is https://expo.dev/go and lists SDK 57 as the current version for iOS and Android.
