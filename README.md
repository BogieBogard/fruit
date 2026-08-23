# Fruit

A private, ad-free native Android fruit-merging game prototype built with Kotlin and Jetpack Compose.

## Current prototype

- Native Compose UI
- Tap-to-drop fruit
- Gravity and simple collision response
- Matching fruit merge into larger fruit
- Score tracking
- Adaptive full-width board suitable for folded and unfolded devices
- GitHub Actions debug APK build

## Install on Android

Open the latest successful **Android APK** workflow run in GitHub Actions, download the `fruit-debug-apk` artifact, unzip it, and install `app-debug.apk` on your Android device. You may need to allow installs from the browser/files app you use to open the APK.

## Development

Open the repository in Android Studio and run the `app` configuration on a device or emulator. The project targets Android API 35 and requires JDK 17.

## Direction

This project uses the general merge-game mechanic as inspiration while keeping its implementation, presentation, names, assets, and future mechanics original.
