import shutil
import os

src_interior = r"C:\Users\Admin\.gemini\antigravity\brain\453871ae-e233-4205-93b7-023690c17740\beomeo_interior_1787297791009.jpg"
src_street = r"C:\Users\Admin\.gemini\antigravity\brain\453871ae-e233-4205-93b7-023690c17740\beomeo_street_1787299251891.jpg"

dst_dir = r"C:\Users\Admin\Desktop\부동산ai"

try:
    os.makedirs(dst_dir, exist_ok=True)
    
    shutil.copy2(src_interior, os.path.join(dst_dir, "beomeo_interior.jpg"))
    shutil.copy2(src_street, os.path.join(dst_dir, "beomeo_street.jpg"))
    
    print("Success: Copied both images to C:\\Users\\Admin\\Desktop\\부동산ai!")
except Exception as e:
    print("Error copying: " + str(e))
