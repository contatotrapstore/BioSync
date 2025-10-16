#!/usr/bin/env python3
"""
Script para fazer upload de capas de jogos para Supabase Storage

Uso:
    python upload-game-covers.py

Dependências:
    pip install requests

Configuração:
    Edite as variáveis SUPABASE_URL e SUPABASE_ANON_KEY abaixo
"""

import os
import requests
from pathlib import Path
import sys

# ===================================================================
# CONFIGURAÇÃO - AJUSTAR PARA SEU PROJETO
# ===================================================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://SEU_PROJETO.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "SUA_ANON_KEY_AQUI")
STORAGE_BUCKET = "games"
STORAGE_PATH = "covers"
IMAGES_DIR = Path("imagens-convertidas/")

# ===================================================================
# NÃO MODIFICAR ABAIXO DESTA LINHA
# ===================================================================

def upload_image(file_path: Path, headers: dict) -> bool:
    """
    Faz upload de uma imagem para o Supabase Storage

    Args:
        file_path: Caminho do arquivo a ser enviado
        headers: Headers HTTP com autenticação

    Returns:
        True se sucesso, False se falhou
    """
    file_name = file_path.name
    storage_file_path = f"{STORAGE_PATH}/{file_name}"
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{storage_file_path}"

    print(f"📤 Uploading {file_name}...", end=" ", flush=True)

    try:
        # Ler arquivo
        with open(file_path, "rb") as f:
            file_data = f.read()

        # Preparar headers
        upload_headers = headers.copy()
        upload_headers["Content-Type"] = "image/png"
        upload_headers["x-upsert"] = "false"  # Não sobrescrever se já existe

        # Tentar upload (POST = criar novo)
        response = requests.post(url, data=file_data, headers=upload_headers, timeout=30)

        if response.status_code == 200:
            print("✅ [OK] Sucesso!")
            return True
        elif response.status_code == 409:
            # Arquivo já existe, tentar atualizar
            print("⚠️  [EXISTS] Arquivo já existe, atualizando...", end=" ", flush=True)
            upload_headers["x-upsert"] = "true"
            response = requests.post(url, data=file_data, headers=upload_headers, timeout=30)

            if response.status_code == 200:
                print("✅ [OK]")
                return True

        # Erro
        print(f"❌ [ERRO {response.status_code}]")
        print(f"   Resposta: {response.text[:200]}")
        return False

    except requests.exceptions.Timeout:
        print("❌ [TIMEOUT] Tempo esgotado")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"❌ [CONNECTION ERROR] {e}")
        return False
    except Exception as e:
        print(f"❌ [ERRO] {e}")
        return False

def validate_config() -> bool:
    """
    Valida se as configurações estão corretas

    Returns:
        True se válidas, False caso contrário
    """
    if "SEU_PROJETO" in SUPABASE_URL or "SUA_ANON_KEY" in SUPABASE_ANON_KEY:
        print("❌ ERRO: Configuração inválida!")
        print("   Por favor, edite o script e configure:")
        print(f"   - SUPABASE_URL (atualmente: {SUPABASE_URL})")
        print(f"   - SUPABASE_ANON_KEY (atualmente: {'*' * 20}...)")
        print()
        print("   Você pode definir variáveis de ambiente:")
        print("   export SUPABASE_URL='https://seu-projeto.supabase.co'")
        print("   export SUPABASE_ANON_KEY='sua-anon-key-aqui'")
        return False

    return True

def main():
    """Função principal"""
    print("=" * 70)
    print("UPLOAD DE IMAGENS PARA SUPABASE STORAGE")
    print("=" * 70)
    print()

    # Validar configuração
    if not validate_config():
        sys.exit(1)

    # Verificar se o diretório existe
    if not IMAGES_DIR.exists():
        print(f"❌ Diretório não encontrado: {IMAGES_DIR}")
        print("   Execute convert-images.py primeiro para converter as imagens")
        sys.exit(1)

    # Listar imagens
    images = list(IMAGES_DIR.glob("*.png"))

    if not images:
        print(f"❌ Nenhuma imagem PNG encontrada em {IMAGES_DIR}")
        sys.exit(1)

    print(f"📁 Diretório: {IMAGES_DIR.absolute()}")
    print(f"🔗 Supabase URL: {SUPABASE_URL}")
    print(f"🗄️  Bucket: {STORAGE_BUCKET}")
    print(f"📂 Path: {STORAGE_PATH}/")
    print(f"📸 Imagens encontradas: {len(images)}")
    print()

    # Preparar headers de autenticação
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }

    # Fazer upload das imagens
    success = 0
    failed = 0

    for img in sorted(images):
        if upload_image(img, headers):
            success += 1
        else:
            failed += 1

    # Resumo
    print()
    print("=" * 70)
    print("RESUMO DO UPLOAD")
    print("=" * 70)
    print(f"✅ Sucessos: {success}")
    print(f"❌ Falhas:   {failed}")
    print(f"📊 Total:    {len(images)}")
    print()

    if success > 0:
        print("🎉 URLs das imagens (use no banco de dados):")
        print(f"   {SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{STORAGE_PATH}/[nome-arquivo].png")
        print()

    print("=" * 70)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Upload interrompido pelo usuário")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n❌ Erro fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
