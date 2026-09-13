import os

search_dirs = [r"C:\Users\Admin\Desktop\부동산ai", r"D:\UserFiles\Desktop\안티그래비티_마케팅_모음"]
extensions = ['.csv', '.json', '.txt', '.py', '.log']

found_files = []

for sdir in search_dirs:
    if os.path.exists(sdir):
        for root, dirs, files in os.walk(sdir):
            if "node_modules" in root or ".git" in root or ".next" in root:
                continue
            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    path = os.path.join(root, file)
                    if "lead" in file.lower() or "db" in file.lower() or "form" in file.lower() or "brief" in file.lower():
                        found_files.append(path)

print("Found matching files:")
for path in found_files:
    print(f" - {path} (size: {os.path.getsize(path)} bytes)")
