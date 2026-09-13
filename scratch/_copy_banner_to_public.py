import shutil
import os

src = r"C:\Users\Admin\Desktop\안티그래비티_마케팅_모음\이미지_배너_모음\beomeo_banner.jpg"
dst = r"D:\UserFiles\Desktop\안티그래비티_마케팅_모음\LandNote_프로젝트\landnote\apps\web\public\beomeo_banner.jpg"

try:
    if os.path.exists(src):
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        print("Success: Copied banner image to web public folder!")
    else:
        print("Error: Source file not found at " + src)
except Exception as e:
    print("Error copying: " + str(e))
