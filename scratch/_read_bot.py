import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

filepath = r"D:\UserFiles\Desktop\부동산ai\discord_to_sheet.py"

if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        print("Lines containing lead, facebook, sheet, form or 양식 in discord_to_sheet.py:")
        for idx, line in enumerate(content.splitlines()):
            if any(k in line for k in ["lead", "facebook", "sheet", "form", "양식", "메타", "페이스북"]):
                print(f"L{idx}: {line}")
else:
    print("File not found")
