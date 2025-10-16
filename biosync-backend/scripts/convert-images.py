#!/usr/bin/env python3
"""
Script para converter imagens de jogos para PNG
Converte JPG, JPEG, JFIF, WEBP para PNG otimizado

Uso:
    python convert-images.py

Dependências:
    pip install Pillow
"""

from PIL import Image
from pathlib import Path
import sys

# Configurações
INPUT_DIR = Path("imagens-originais/")
OUTPUT_DIR = Path("imagens-convertidas/")
SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.jfif', '.webp', '.png']

def convert_image(input_path: Path, output_dir: Path) -> bool:
    """
    Converte uma imagem para PNG otimizado

    Args:
        input_path: Caminho da imagem original
        output_dir: Diretório de saída

    Returns:
        True se converteu com sucesso, False caso contrário
    """
    try:
        # Abrir imagem
        img = Image.open(input_path)

        # Converter para RGB se necessário (remover transparência)
        if img.mode in ['RGBA', 'P', 'LA']:
            # Criar fundo branco
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ['RGBA', 'LA'] else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Nome do arquivo de saída
        output_name = f"{input_path.stem}-cover.png"
        output_path = output_dir / output_name

        # Salvar como PNG otimizado
        img.save(output_path, 'PNG', optimize=True, compress_level=9)

        # Informações sobre a conversão
        input_size = input_path.stat().st_size / 1024  # KB
        output_size = output_path.stat().st_size / 1024  # KB
        reduction = ((input_size - output_size) / input_size * 100) if input_size > 0 else 0

        print(f"✅ {input_path.name} → {output_name}")
        print(f"   Tamanho: {input_size:.1f} KB → {output_size:.1f} KB ({reduction:+.1f}%)")

        return True

    except Exception as e:
        print(f"❌ Erro ao converter {input_path.name}: {e}")
        return False

def main():
    """Função principal"""
    print("=" * 70)
    print("CONVERSÃO DE IMAGENS PARA PNG")
    print("=" * 70)
    print()

    # Verificar se o diretório de entrada existe
    if not INPUT_DIR.exists():
        print(f"❌ Diretório de entrada não encontrado: {INPUT_DIR}")
        print(f"   Crie o diretório e coloque as imagens nele")
        sys.exit(1)

    # Criar diretório de saída
    OUTPUT_DIR.mkdir(exist_ok=True)
    print(f"📁 Input:  {INPUT_DIR.absolute()}")
    print(f"📁 Output: {OUTPUT_DIR.absolute()}")
    print()

    # Listar imagens
    images = []
    for ext in SUPPORTED_FORMATS:
        images.extend(list(INPUT_DIR.glob(f"*{ext}")))
        images.extend(list(INPUT_DIR.glob(f"*{ext.upper()}")))

    if not images:
        print(f"❌ Nenhuma imagem encontrada em {INPUT_DIR}")
        print(f"   Formatos suportados: {', '.join(SUPPORTED_FORMATS)}")
        sys.exit(1)

    print(f"📸 Encontradas {len(images)} imagens para converter")
    print()

    # Converter imagens
    success = 0
    failed = 0

    for img_path in sorted(images):
        if convert_image(img_path, OUTPUT_DIR):
            success += 1
        else:
            failed += 1
        print()  # Linha em branco entre conversões

    # Resumo
    print("=" * 70)
    print("RESUMO DA CONVERSÃO")
    print("=" * 70)
    print(f"✅ Sucessos: {success}")
    print(f"❌ Falhas:   {failed}")
    print(f"📊 Total:    {len(images)}")
    print()
    print(f"📁 Imagens convertidas salvas em: {OUTPUT_DIR.absolute()}")
    print("=" * 70)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Conversão interrompida pelo usuário")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n❌ Erro fatal: {e}")
        sys.exit(1)
