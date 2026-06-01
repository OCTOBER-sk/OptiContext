#!/bin/bash
set -euo pipefail

echo "╔══════════════════════════════════════════════════╗"
echo "║       OptiContext — One-Time Setup Script        ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# 1. Check prerequisites
echo "🔍 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required"; exit 1; }
command -v wrangler >/dev/null 2>&1 || { echo "❌ Installing wrangler..."; npm install -g wrangler; }
echo "✅ Prerequisites satisfied"

# 2. Install dependencies
echo ""
echo "📦 Installing dependencies..."
cd worker
npm install
cd ..
echo "✅ Dependencies installed"

# 3. Create KV namespaces
echo ""
echo "🗄️  Creating Cloudflare KV namespaces..."
API_KEYS_ID=$(wrangler kv:namespace create "API_KEYS" | grep -oP 'id = "\K[^"]+')
RATE_LIMITS_ID=$(wrangler kv:namespace create "RATE_LIMITS" | grep -oP 'id = "\K[^"]+')
CACHE_ID=$(wrangler kv:namespace create "CACHE" | grep -oP 'id = "\K[^"]+')

sed -i "s/id = \"\" # API_KEYS/id = \"$API_KEYS_ID\" # API_KEYS/" worker/wrangler.toml
sed -i "s/id = \"\" # RATE_LIMITS/id = \"$RATE_LIMITS_ID\" # RATE_LIMITS/" worker/wrangler.toml
sed -i "s/id = \"\" # CACHE/id = \"$CACHE_ID\" # CACHE/" worker/wrangler.toml
echo "✅ KV namespaces created"

# 4. Create R2 buckets
echo ""
echo "🪣  Creating Cloudflare R2 buckets..."
wrangler r2 bucket create opticontext-files
wrangler r2 bucket create opticontext-tts
echo "✅ R2 buckets created"

# 5. Set up Turso database
echo ""
echo "💾 Setting up Turso database..."
if command -v turso >/dev/null 2>&1; then
  turso db create opticontext
  turso db shell opticontext < db/turso/schema.sql
  echo "✅ Turso database created"
else
  echo "⚠️  turso CLI not found. Please install it and run:"
  echo "   turso db create opticontext"
  echo "   turso db shell opticontext < db/turso/schema.sql"
fi

# 6. Set up Supabase
echo ""
echo "🗄️  Setting up Supabase..."
echo "⚠️  Please run the SQL in db/supabase/schema.sql in your Supabase SQL editor"
echo "   Go to: https://supabase.com/dashboard -> Your project -> SQL Editor"

# 7. Set up Firebase
echo ""
echo "🔥 Setting up Firebase..."
echo "⚠️  Create a Firebase project at https://console.firebase.google.com"
echo "   Enable Authentication (Email/Password + Google)"
echo "   Copy the Firebase config to dashboard/src/lib/firebase.ts"

# 8. Create .env file
echo ""
echo "🔑 Creating .env file..."
cat > .env << EOF
# OptiContext Environment Configuration
# Fill in your actual API keys below

# AI Providers
CEREBRAS_API_KEY=
GEMINI_API_KEY=

# Search Providers
TAVILY_API_KEY=
APIFY_API_KEY=

# Voice
UNREAL_SPEECH_KEY=

# Storage
TURSO_DB_URL=
TURSO_AUTH_TOKEN=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Auth
FIREBASE_PROJECT_ID=
EOF
echo "✅ .env file created (fill in your keys)"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     ✅ Setup complete! Fill in .env keys to      ║"
echo "║        deploy: cd worker && wrangler deploy       ║"
echo "╚══════════════════════════════════════════════════╝"
