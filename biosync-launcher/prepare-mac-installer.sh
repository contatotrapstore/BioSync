#!/bin/bash

# Script para preparar o instalador do macOS
# Garante que o arquivo .command tenha permissÃ£o de execuÃ§Ã£o

echo "Preparando instalador macOS..."

# Dar permissÃ£o de execuÃ§Ã£o ao script de instalaÃ§Ã£o
chmod +x "build/Instalar NeuroOne.command"
chmod +x "build/install-macos.sh"

echo "âœ… Arquivos preparados com sucesso!"
