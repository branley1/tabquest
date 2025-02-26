# TabQuest - Turn Your Web Browsing into an RPG Adventure!

TabQuest is a Chrome extension that transforms your everyday web browsing into an exciting RPG-style adventure. Earn XP and gold, encounter monsters, find treasure, solve riddles, and level up – all while browsing the web!

## Features

- **Tab Tracking & Event System**: Random RPG events when opening tabs
- **Rewards for Good Browsing Habits**: Earn XP for focusing on a single tab
- **Character Classes**: Choose between Warrior, Mage, or Rogue
- **RPG Progression**: Level up, collect gold, and complete quests
- **Power-ups & Buffs**: Discover power-ups that enhance your browsing rewards
- **Achievements**: Complete special tasks to earn achievements

## Installation

### Developer Mode Installation

1. Clone this repository:
   ```
   git clone https://github.com/branley1/tabquest.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top-right corner

4. Click "Load unpacked" and select the TabQuest directory

5. TabQuest should now be installed and visible in your extensions

### Building the Extension

1. Ensure you have Node.js installed

2. Install dependencies:
   ```
   npm install
   ```

3. Make the build script executable (first time only):
   ```
   chmod +x build.sh
   ```

4. Build the extension:
   ```
   npm run build
   ```

5. The bundled extension will be in the `dist` folder ready for loading into Chrome

6. Load the built extension:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## How to Play

1. **Choose Your Class**: When you first launch TabQuest, select your character class:
   - **Warrior**: +10% XP, -10% Gold (Great for XP farming)
   - **Mage**: +20% XP, -20% Gold (Best for leveling up quickly)
   - **Rogue**: -10% XP, +20% Gold (Best for accumulating wealth)

2. **Open Tabs**: Each new tab has a chance to trigger:
   - Monster encounters (defeat them for rewards)
   - Treasure discoveries
   - Riddles to solve
   - Power-ups to collect

3. **Close Tabs**: Earn rewards for closing tabs, with bonus XP for tabs you've focused on for longer periods.

4. **Complete Quests**: Check your active quests and work towards completing them for special rewards.

5. **Collect Achievements**: Perform special actions to unlock achievements and titles.

## Game Mechanics

- **XP & Leveling**: Gain XP from various activities. The XP required for each level increases as you progress.
- **Gold**: Collect gold to unlock future features and items.
- **Buffs**: Power-ups provide temporary bonuses to XP or gold gains.
- **Quests**: Complete specific objectives to earn substantial rewards.

## Development

### Project Structure

```
tabquest/
├── manifest.json           # Extension manifest
├── popup.html              # Popup UI
├── popup.js                # Popup logic
├── popup.css               # Popup styles
├── background.js           # Service worker entry point
├── content.js              # Content script
├── icons/                  # Extension icons
├── public/                 # Public assets
├── tests/                  # Test files
├── coverage/               # Test coverage reports
├── jest.config.js          # Jest configuration
└── src/
    ├── background/         # Background service worker modules
    ├── content/            # Content script modules
    ├── models/             # Game data models
    ├── popup/              # Popup UI components
    └── utils/              # Utility functions
```

### Adding New Features

- **New Monster Types**: Add to the `monsters` array in `src/models/events.js`
- **New Power-ups**: Add to the `powerUps` array in `src/models/events.js`
- **New Quests**: Add to the `quests` array in `src/models/events.js`

## License

MIT License - Feel free to modify and distribute this extension.

## Credits

Created by Branley Mmasi

Assets for monsters, items, and UI elements are placeholders and will be replaced with original artwork before public distribution.

---

Happy questing through the web! 🏆✨ 