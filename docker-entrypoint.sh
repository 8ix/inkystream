#!/bin/sh
set -e

# Ensure config directory exists and has default files if they don't exist
CONFIG_DIR="/app/config"
DEFAULT_CONFIG_DIR="/app/config.default"

# Create config directory if it doesn't exist (shouldn't happen with volume mount, but just in case)
mkdir -p "$CONFIG_DIR"

# Copy default config files if they don't exist in the mounted volume
# This ensures users don't lose default displays.json, etc. on first run
# The volume mount happens before this script runs, so we can safely copy defaults
if [ ! -f "$CONFIG_DIR/categories.json" ] && [ -f "$DEFAULT_CONFIG_DIR/categories.json" ]; then
  echo "Initializing categories.json from defaults..."
  cp "$DEFAULT_CONFIG_DIR/categories.json" "$CONFIG_DIR/categories.json"
fi

if [ ! -f "$CONFIG_DIR/devices.json" ] && [ -f "$DEFAULT_CONFIG_DIR/devices.json" ]; then
  echo "Initializing devices.json from defaults..."
  cp "$DEFAULT_CONFIG_DIR/devices.json" "$CONFIG_DIR/devices.json"
fi

if [ ! -f "$CONFIG_DIR/displays.json" ] && [ -f "$DEFAULT_CONFIG_DIR/displays.json" ]; then
  echo "Initializing displays.json from defaults..."
  cp "$DEFAULT_CONFIG_DIR/displays.json" "$CONFIG_DIR/displays.json"
fi

# Ensure proper permissions (may not work with volume mounts, but try anyway)
chmod -R 755 "$CONFIG_DIR" 2>/dev/null || true

# Execute the main command
exec "$@"
