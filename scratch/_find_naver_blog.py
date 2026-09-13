import os
import re

search_dir = r"D:\UserFiles\Desktop\안티그래비티_마케팅_모음"
pattern = re.compile(r"https://blog\.naver\.com/\S+")

matches = []

for root, dirs, files in os.walk(search_dir):
    # Skip node_modules
    if "node_modules" in root or ".git" in root or ".next" in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts', '.html', '.js', '.json', '.txt', '.py')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    found = pattern.findall(content)
                    if found:
                        matches.append((path, found))
            except Exception as e:
                pass

for path, urls in matches:
    print(f"File: {path}")
    for url in urls:
        print(f"  URL: {url}")
