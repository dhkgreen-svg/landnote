import shutil
import os

src = r"C:\Users\Admin\.gemini\antigravity\brain\453871ae-e233-4205-93b7-023690c17740\beomeo_street_1787299251891.jpg"
dst = r"D:\UserFiles\Desktop\안티그래비티_마케팅_모음\LandNote_프로젝트\landnote\apps\web\public\beomeo_street.jpg"

try:
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        print("Success: Copied street image to web public folder!")
    else:
        print("Error: Source file not found")
except Exception as e:
    print("Error copying: " + str(e))
