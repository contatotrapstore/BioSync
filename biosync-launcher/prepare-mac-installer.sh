#!/bin/bash

# Script para preparar o instalador do macOS
# Garante que o arquivo .command tenha permissão de execução

echo "Preparando instalador macOS..."

# Dar permissão de execução ao script de instalação
chmod +x "build/Instalar biosync.command"
chmod +x "build/install-macos.sh"

echo "✅ Arquivos preparados com sucesso!"
