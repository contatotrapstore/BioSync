#!/bin/bash

echo "========================================"
echo "NeuroGame Launcher - Installation"
echo "========================================"
echo ""

echo "[1/3] Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to install dependencies"
    echo "Please check your Node.js installation"
    exit 1
fi

echo ""
echo "[2/3] Checking Jogos folder..."
if [ ! -d "../Jogos" ]; then
    echo "WARNING: ../Jogos folder not found"
    echo "Creating folder..."
    mkdir -p "../Jogos"
    echo "Folder created. Please add your games here."
else
    echo "Jogos folder found!"
fi

echo ""
echo "[3/3] Setup complete!"
echo ""
echo "========================================"
echo "Next Steps:"
echo "========================================"
echo "1. Make sure your backend API is running"
echo "2. Add games to the ../Jogos folder"
echo "3. Run: npm run dev"
echo ""
echo "For production build:"
echo "  - Windows: npm run build:win"
echo "  - macOS:   npm run build:mac"
echo "  - Linux:   npm run build:linux"
echo ""
echo "Read SETUP.md for detailed instructions"
echo "========================================"
echo ""
