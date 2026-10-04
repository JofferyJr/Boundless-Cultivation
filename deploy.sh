#!/bin/bash
# Boundless Cultivation - PR Deploy Script
# Usage: ./deploy.sh

set -e

echo "🚀 Boundless Cultivation - Prepare PR"

# Check if in repo
if [ ! -d ".git" ]; then
  echo "❌ Bukan dalam git repo. Clone dulu:"
  echo "git clone https://github.com/JofferyJr/Boundless-Cultivation.git"
  exit 1
fi

BRANCH="fix/refine-github-runtime-$(date +%Y%m%d-%H%M)"

echo "📦 Creating branch: $BRANCH"
git checkout -b $BRANCH

echo "📋 Copying refined files..."
# Pastikan file refined ada dalam /tmp atau current dir
# Copy dari pr-package

if [ -d "boundless-pr/site" ]; then
  cp boundless-pr/site/index.html site/index.html
  cp boundless-pr/site/assets/v819-weapon-system.js site/assets/v819-weapon-system.js
  cp boundless-pr/site/assets/v819-weapon-system.css site/assets/v819-weapon-system.css
  cp boundless-pr/tools/*.py tools/
  echo "✅ Files copied"
else
  echo "❌ boundless-pr folder tak jumpa. Extract zip dulu."
  exit 1
fi

echo "🔍 Running audits..."
python tools/audit_static_runtime.py site || echo "⚠️ Audit ada warnings"
python tools/release_audit.py --root . --write docs/audit.md || echo "⚠️ Release audit ada warnings"

echo "📝 Git status:"
git status

echo ""
echo "✅ Ready untuk commit. Run:"
echo "git add site/index.html site/assets/v819-weapon-system.* tools/*.py docs/audit.md"
echo "git commit -m 'fix: refine GitHub Pages runtime - index, weapon system, tools'"
echo "git push origin $BRANCH"
echo ""
echo "Lepas push, buka GitHub dan create PR dari $BRANCH ke main"
