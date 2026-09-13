import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\UserFiles\Desktop\부동산ai\landing_page_0818_070223.html"

if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        print(content)
else:
    print("File not found")
