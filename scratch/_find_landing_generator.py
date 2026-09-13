import os

search_dirs = [r"C:\Users\Admin\Desktop\부동산ai", r"D:\UserFiles\Desktop\안티그래비티_마케팅_모음"]
found = []

for sdir in search_dirs:
    if os.path.exists(sdir):
        for root, dirs, files in os.walk(sdir):
            if "node_modules" in root or ".git" in root:
                continue
            for file in files:
                lower_file = file.lower()
                if "landing" in lower_file or "generator" in lower_file or "생성" in lower_file or "대본" in lower_file:
                    found.append(os.path.join(root, file))

print("Matching files found:")
for path in found:
    print(f" - {path}")
