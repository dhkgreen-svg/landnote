import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

d_desktop = r"D:\UserFiles\Desktop"
if os.path.exists(d_desktop):
    print("Listing directories in D:\\UserFiles\\Desktop:")
    for f in os.listdir(d_desktop):
        path = os.path.join(d_desktop, f)
        if os.path.isdir(path):
            print(f" [DIR]  {f}")
        else:
            print(f" [FILE] {f}")
else:
    print("D:\\UserFiles\\Desktop does not exist")
