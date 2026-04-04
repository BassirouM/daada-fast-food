#!/usr/bin/env bash
# =============================================================================
# DAADA FAST FOOD — Setup Script
# Run: bash scripts/setup.sh
# =============================================================================

set -e

echo "🍔 Setting up Daada Fast Food..."

# Check Node.js version
REQUIRED_NODE="20"
CURRENT_NODE=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$CURRENT_NODE" -lt "$REQUIRED_NODE" ]; then
  echo "❌ Node.js $REQUIRED_NODE+ required. Current: $(node -v)"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Create .env.local from example
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "✅ Created .env.local — Fill in your credentials!"
else
  echo "ℹ️  .env.local already exists"
fi

# Create public/manifest.json for PWA
echo "📱 Creating PWA manifest..."
cat > public/manifest.json << 'EOF'
{
  "name": "Daada Fast Food",
  "short_name": "Daada",
  "description": "Livraison de nourriture rapide à Maroua, Cameroun",
  "start_url": "/menu",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0A0A0A",
  "theme_color": "#FF6B00",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["food", "shopping"],
  "lang": "fr"
}
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Fill in .env.local with your Supabase credentials"
echo "  2. Run migrations: npx supabase db push"
echo "  3. Start dev server: npm run dev"
echo ""
echo "📖 Read CLAUDE.md for full documentation"
