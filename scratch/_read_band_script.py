import os

target_file = r"C:\Users\Admin\Desktop\부동산ai\기타 프로그램 보관\naver_band_auto_post_final.py"

if os.path.exists(target_file):
    with open(target_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        print("Found lines containing naver or blog or http:")
        for line in content.splitlines():
            if "naver" in line or "blog" in line or "http" in line:
                print(line)
else:
    print("File not found")
