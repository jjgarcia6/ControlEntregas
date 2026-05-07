#!/usr/bin/env bash
set -e

echo "==> Instalando dependencias del backend..."
cd /workspaces/controlEntregas/backend
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
pip install ruff mypy bandit pip-audit --quiet

echo "==> Instalando dependencias del frontend..."
cd /workspaces/controlEntregas/frontend
npm install --silent

echo "==> Copiando archivos .env de ejemplo si no existen..."
cd /workspaces/controlEntregas
[ ! -f backend/.env ] && cp backend/.env.example backend/.env && echo "  backend/.env creado — recuerda añadir tus credenciales"
[ ! -f frontend/.env ] && cp frontend/.env.example frontend/.env && echo "  frontend/.env creado"

echo "==> Listo. Entorno configurado."
