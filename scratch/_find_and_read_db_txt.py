import os

def find_and_read():
    for root, dirs, files in os.walk(r"D:\UserFiles\Desktop"):
        for f in files:
            if "DB코드복사" in f:
                path = os.path.join(root, f)
                print(f"Found file: {path}")
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                        content = file.read()
                        print("File content lines containing key words:")
                        for idx, line in enumerate(content.splitlines()):
                            if any(k in line for k in ["160", "dhk", "blog", "양식", "naver", "폼", "전화", "자세히"]):
                                print(f"L{idx}: {line}")
                except Exception as e:
                    print("Error reading: " + str(e))

find_and_read()
