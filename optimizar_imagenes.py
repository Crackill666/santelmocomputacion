import os
from PIL import Image

# CONFIGURACIÓN
CARPETA_BASE = "assets/products"
MAX_SIZE = 1200        # Máximo ancho o alto en píxeles
CALIDAD_JPG = 80       # 70-85 es ideal
CONVERTIR_A_JPG = True # True = convierte PNG a JPG

def optimizar_imagen(ruta):
    try:
        img = Image.open(ruta)
        img = img.convert("RGB")

        # Redimensionar manteniendo proporción
        img.thumbnail((MAX_SIZE, MAX_SIZE))

        if CONVERTIR_A_JPG:
            nueva_ruta = os.path.splitext(ruta)[0] + ".jpg"
            img.save(nueva_ruta, "JPEG", quality=CALIDAD_JPG, optimize=True)
            if ruta.lower().endswith(".png"):
                os.remove(ruta)
        else:
            img.save(ruta, quality=CALIDAD_JPG, optimize=True)

        print(f"✔ Optimizada: {ruta}")

    except Exception as e:
        print(f"✖ Error en {ruta}: {e}")

for root, dirs, files in os.walk(CARPETA_BASE):
    for file in files:
        if file.lower().endswith((".jpg", ".jpeg", ".png")):
            ruta_completa = os.path.join(root, file)
            optimizar_imagen(ruta_completa)

print("\n🎉 Proceso terminado")
