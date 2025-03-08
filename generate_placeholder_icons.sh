#!/bin/bash

# Create main extension icons
echo "Creating main extension icons..."
echo '<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg"><rect width="128" height="128" fill="#5D3FD3"/><text x="64" y="80" font-family="Arial" font-size="20" text-anchor="middle" fill="white">TabQuest</text></svg>' > icons/icon128.svg
echo '<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="#5D3FD3"/><text x="24" y="30" font-family="Arial" font-size="10" text-anchor="middle" fill="white">TQ</text></svg>' > icons/icon48.svg
echo '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><rect width="16" height="16" fill="#5D3FD3"/></svg>' > icons/icon16.svg

# Create placeholder icons for different categories
CATEGORIES=("monsters" "treasures" "powerups" "classes")
COLORS=("#FF5757" "#FFD700" "#50C878" "#4A2BA8")

for i in "${!CATEGORIES[@]}"; do
  category=${CATEGORIES[$i]}
  color=${COLORS[$i]}
  echo "Creating placeholder icons for $category..."
  
  # Create directory if it doesn't exist
  mkdir -p "icons/$category"
  
  case "$category" in
    "monsters")
      items=("goblin" "troll" "dragon" "virus" "popup")
      ;;
    "treasures")
      items=("gold_pouch" "scroll" "gem" "artifact")
      ;;
    "powerups")
      items=("focus_potion" "lucky_charm" "shield")
      ;;
    "classes")
      items=("warrior" "mage" "rogue")
      ;;
  esac
  
  for item in "${items[@]}"; do
    echo '<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="'$color'"/><text x="32" y="40" font-family="Arial" font-size="10" text-anchor="middle" fill="white">'$item'</text></svg>' > "icons/$category/$item.svg"
  done
done

# Create other utility icons
echo "Creating utility icons..."
echo '<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#5D3FD3"/><text x="10" y="14" font-family="Arial" font-size="10" text-anchor="middle" fill="white">XP</text></svg>' > icons/xp.svg
echo '<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#FFC857"/><text x="10" y="14" font-family="Arial" font-size="10" text-anchor="middle" fill="white">G</text></svg>' > icons/gold.svg
echo '<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#4EA8DE"/><text x="32" y="40" font-family="Arial" font-size="10" text-anchor="middle" fill="white">Riddle</text></svg>' > icons/riddle.svg
echo '<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#FFC857"/><text x="32" y="40" font-family="Arial" font-size="10" text-anchor="middle" fill="white">Level Up</text></svg>' > icons/level_up.svg
echo '<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#5D3FD3"/><text x="32" y="40" font-family="Arial" font-size="10" text-anchor="middle" fill="white">Quest</text></svg>' > icons/quest_complete.svg
echo '<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#4A2BA8"/><text x="32" y="40" font-family="Arial" font-size="10" text-anchor="middle" fill="white">Tab</text></svg>' > icons/tab_closed.svg
echo '<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#FFC857"/><text x="32" y="40" font-family="Arial" font-size="10" text-anchor="middle" fill="white">Achievement</text></svg>' > icons/achievement.svg

echo "Icon generation complete!"

# Rename all PNG files to SVG in the icons directory
for file in icons/*.png; do
  if [ -f "$file" ]; then
    mv "$file" "${file%.png}.svg"
  fi
done

# Also handle subdirectories
for dir in icons/*/; do
  if [ -d "$dir" ]; then
    for file in "$dir"*.png; do
      if [ -f "$file" ]; then
        mv "$file" "${file%.png}.svg"
      fi
    done
  fi
done

echo "Renamed all .png files to .svg" 