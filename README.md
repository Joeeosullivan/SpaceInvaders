# Document Processing Space Invaders

A fun and interactive Space Invaders game that simulates the life of a case analyst processing onboarding documents for B2B lending. The game demonstrates the difference between manual document processing and AI-assisted processing.

## 🎮 Game Features

### Manual Mode (Case Analyst)
- Slow shooting with cooldown delays
- Inaccurate shots with spread
- Unknown document values (all appear grey)
- Limited processing efficiency

### AI Agent Mode
- Fast shooting with perfect accuracy
- Pre-classified documents with visible values
- Main AI agent that lassos documents to appropriate lanes
- Secondary agent that auto-targets low-value documents
- Dramatically improved processing efficiency

## 🚀 Deployment

This game is ready to deploy to Vercel:

1. **Push to GitHub**: Upload your code to a GitHub repository
2. **Connect to Vercel**: 
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Deploy automatically

3. **Alternative deployment**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from project directory
   vercel
   ```

## 🎯 How to Play

1. **Choose your starting mode** (Manual or AI)
2. **Use arrow keys** to move left/right
3. **Press spacebar** to shoot documents
4. **Press M** to toggle between modes during gameplay
5. **Maximize revenue** by hitting high-value documents
6. **Avoid missing** too many documents (game over after 20 missed)

## 📊 Game Metrics

- **Process Rate**: Percentage of documents successfully processed
- **Revenue**: Total dollar value of processed documents
- **Missed**: Percentage of documents that passed by unprocessed
- **Time**: 60-second countdown timer

## 🛠️ Local Development

```bash
# Serve locally
python -m http.server 8000

# Or use any static file server
npx serve .
```

## 📁 Project Structure

```
├── index.html          # Main game interface
├── styles.css          # Game styling and layout
├── game.js            # Core game logic and mechanics
├── vercel.json        # Vercel deployment configuration
├── package.json       # Project metadata
└── README.md          # This file
```

## 🎨 Technologies Used

- **HTML5 Canvas** for game rendering
- **Vanilla JavaScript** for game logic
- **CSS3** for modern UI styling
- **Responsive design** for mobile compatibility

## 📱 Mobile Support

The game is fully responsive and works on:
- Desktop browsers
- Mobile devices
- Tablets
- Touch controls (where supported)

## 🏆 Game Objectives

- Demonstrate the efficiency difference between manual and AI processing
- Show how AI can classify and sort documents automatically
- Provide an engaging way to understand B2B document processing workflows
- Track performance metrics to show business value

---

**Ready to deploy to Vercel!** 🚀
