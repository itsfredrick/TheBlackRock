#!/bin/bash
# separate_sh_files.sh
# Script to collect all .sh files from current folder (recursively) into a single directory

set -euo pipefail

# Create destination folder
DEST_DIR="./sh_files"
mkdir -p "$DEST_DIR"

# Find all .sh files and copy them preserving folder structure
find . -type f -name "*.sh" | while read -r file; do
  # Get relative path without leading ./
  rel_path="${file#./}"
  
  # Ensure subdirectories exist inside DEST_DIR
  mkdir -p "$DEST_DIR/$(dirname "$rel_path")"
  
  # Copy the file into the new structure
  cp "$file" "$DEST_DIR/$rel_path"
done

echo "✅ All .sh files have been copied into: $DEST_DIR"
echo "Now you can zip them with: zip -r sh_files.zip $DEST_DIR"
