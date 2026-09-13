import shutil
import os

src = r"C:\Users\Admin\Desktop\부동산ai\기타 프로그램 보관\facebook_auto_poster.py.bak"
dst = r"C:\Users\Admin\Desktop\부동산ai\기타 프로그램 보관\facebook_auto_poster.py"

try:
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print("Success: Restored facebook_auto_poster.py from backup!")
    else:
        print("Error: Backup not found")
except Exception as e:
    print("Error: " + str(e))
