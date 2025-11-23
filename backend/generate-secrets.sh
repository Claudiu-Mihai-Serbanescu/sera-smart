#!/bin/bash
set -e

# Generează chei random
SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -hex 32)   # 32 bytes = 64 hex chars

# Dacă .env nu există, îl creăm
touch .env

# Ștergem valorile vechi (dacă existau)
sed -i '/^SESSION_SECRET=/d' .env
sed -i '/^JWT_SECRET=/d' .env
sed -i '/^ENCRYPTION_KEY=/d' .env

# Adăugăm la sfârșitul fișierului
echo "" >> .env
echo "# === Secrets regenerated $(date) ===" >> .env
echo "SESSION_SECRET=$SESSION_SECRET" >> .env
echo "JWT_SECRET=$JWT_SECRET" >> .env
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env

echo "✅ Cheile au fost generate și adăugate în .env:"
echo "SESSION_SECRET=$SESSION_SECRET"
echo "JWT_SECRET=$JWT_SECRET"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
