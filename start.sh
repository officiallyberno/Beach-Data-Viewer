#!/bin/bash

# Script zum Starten der Beach-Data-Viewer App

echo "🚀 Starte Beach-Data-Viewer..."

# 1. Virtuelle Umgebung aktivieren
if [ -d ".venv" ]; then
    echo "📦 Aktiviere Python-Umgebung..."
    source .venv/bin/activate
else
    echo "❌ Keine virtuelle Umgebung gefunden (.venv fehlt)."
    echo "   Bitte erst mit: python -m venv .venv && source .venv/bin/activate"
    exit 1
fi

# 2. Docker starten (nur wenn nicht schon läuft)
if ! docker ps --format '{{.Names}}' | grep -q 'beach-db'; then
    echo "🐳 Starte Docker-Container..."
    docker-compose up -d
else
    echo "🐳 Docker-Container läuft bereits."
fi

# 3. Backend starten (FastAPI)
echo "⚙️ Starte Backend (FastAPI)..."
uvicorn api.main:app --reload &
BACKEND_PID=$!

# 4. Frontend starten (Remix)
echo "💻 Starte Frontend (Remix)..."
cd web || exit
npm install --legacy-peer-deps
npm run dev &
FRONTEND_PID=$!

# 5. Hinweis zum Beenden
echo ""
echo "✅ App gestartet!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo ""
echo "Zum Beenden: kill $BACKEND_PID $FRONTEND_PID"
wait
