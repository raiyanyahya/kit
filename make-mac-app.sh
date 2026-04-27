#!/usr/bin/env bash
set -e

# ---------- CONFIG (edit only these three lines) ----------
APP_NAME="ICE"                 # human-readable name
APP_VERSION="1.0.0"              # version tag
APP_DIR="$(pwd)"                 # project root (where package.json lives)
# ----------------------------------------------------------

BUILD_DIR="$APP_DIR/dist_electron"
DMG_PATH="$BUILD_DIR/${APP_NAME}-${APP_VERSION}.dmg"

echo ">>> Cleaning previous build …"
rm -rf "$BUILD_DIR"

echo ">>> Building macOS app bundle …"
npx electron-builder --mac --x64 --arm64 \
  --config.asar=false \
  --config.appId="com.example.${APP_NAME}" \
  --config.productName="$APP_NAME" \
  --config.mac.category="public.app-category.productivity" \
  --config.mac.target="dmg" \
  --config.mac.icon="$APP_DIR/build/icons/mac/icon.icns" \
  --config.directories.buildResources="$APP_DIR/build" \
  --config.directories.output="$BUILD_DIR"

echo ">>> Done. Your installer is ready at:"
echo "$DMG_PATH"
