import os

bak_file = r"C:\Users\Admin\Desktop\부동산ai\기타 프로그램 보관\facebook_auto_poster.py.bak"

if os.path.exists(bak_file):
    with open(bak_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        print("Found lines containing naver or blog:")
        for line in content.splitlines():
            if "naver" in line or "blog" in line:
                print(line)
else:
    print("Backup file not found")
