import os

txt_file = r"D:\UserFiles\Desktop\안티그래비티_마케팅_모음\부동산매물_마케팅_자동화\DB코드복사.txt"

if os.path.exists(txt_file):
    with open(txt_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        print("Found lines containing 160 or dhk or blog or 양식 or naver or 폼:")
        lines = content.splitlines()
        for idx, line in enumerate(lines):
            if any(k in line for k in ["160", "dhk", "blog", "양식", "naver", "폼"]):
                print(f"L{idx}: {line}")
else:
    print("DB코드복사.txt not found")
