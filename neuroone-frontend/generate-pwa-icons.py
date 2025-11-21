#!/usr/bin/env python3
"""
Generate PWA icons from NeuroOne logo
Creates square icons with proper padding for PWA and maskable variants
"""

from PIL import Image, ImageDraw
import os

# Paths
LOGO_PATH = "src/assets/logo-neuroone.png"
PUBLIC_DIR = "public"

def create_square_icon(logo_img, size, padding_percent=0, bg_color=(255, 255, 255, 255)):
    """
    Create a square icon from the logo with optional padding

    Args:
        logo_img: PIL Image object
        size: Target size (width and height)
        padding_percent: Padding as percentage of size (0-50)
        bg_color: Background color RGBA tuple
    """
    # Create square canvas
    canvas = Image.new('RGBA', (size, size), bg_color)

    # Calculate padding
    padding = int(size * (padding_percent / 100))
    available_size = size - (2 * padding)

    # Calculate scaling to fit logo in available space
    logo_ratio = logo_img.width / logo_img.height

    if logo_ratio > 1:  # Wider than tall
        new_width = available_size
        new_height = int(available_size / logo_ratio)
    else:  # Taller than wide or square
        new_height = available_size
        new_width = int(available_size * logo_ratio)

    # Resize logo
    logo_resized = logo_img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Calculate position to center logo
    x = (size - new_width) // 2
    y = (size - new_height) // 2

    # Paste logo onto canvas
    canvas.paste(logo_resized, (x, y), logo_resized)

    return canvas

def main():
    print("Generating PWA icons for NeuroOne...")

    # Load original logo
    if not os.path.exists(LOGO_PATH):
        print(f"Error: Logo not found at {LOGO_PATH}")
        return 1

    logo = Image.open(LOGO_PATH)
    print(f"Loaded logo: {logo.width}x{logo.height}px")

    # Ensure public directory exists
    os.makedirs(PUBLIC_DIR, exist_ok=True)

    # White background for standard icons
    white_bg = (255, 255, 255, 255)

    # NeuroOne cyan background for maskable (#00D9FF)
    cyan_bg = (0, 217, 255, 255)

    icons_to_generate = [
        # Standard PWA icons (10% padding)
        ("pwa-192x192.png", 192, 10, white_bg, "PWA icon 192x192"),
        ("pwa-512x512.png", 512, 10, white_bg, "PWA icon 512x512"),

        # Maskable icons (20% safe zone padding)
        ("pwa-192x192-maskable.png", 192, 20, cyan_bg, "Maskable icon 192x192"),
        ("pwa-512x512-maskable.png", 512, 20, cyan_bg, "Maskable icon 512x512"),

        # Apple touch icon (10% padding)
        ("apple-touch-icon.png", 180, 10, white_bg, "Apple touch icon 180x180"),

        # Favicon (10% padding)
        ("favicon.png", 256, 10, white_bg, "Favicon 256x256"),
    ]

    for filename, size, padding, bg_color, description in icons_to_generate:
        output_path = os.path.join(PUBLIC_DIR, filename)

        # Generate icon
        icon = create_square_icon(logo, size, padding, bg_color)

        # Save as PNG
        icon.save(output_path, "PNG", optimize=True)

        print(f"Created {description}: {output_path}")

    print("\nAll PWA icons generated successfully!")
    print(f"\nIcons saved to: {os.path.abspath(PUBLIC_DIR)}")
    return 0

if __name__ == "__main__":
    exit(main())
