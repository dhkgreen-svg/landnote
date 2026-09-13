import os
import re

search_dir = r"C:\Users\Admin\Desktop\부동산ai"
pattern = re.compile(r"https://[a-zA-Z0-9\.]*blog\.naver\.com/\S+")

matches = []

for root, dirs, files in os.walk(search_dir):
    if "node_modules" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts', '.html', '.js', '.json', '.txt', '.py', '.bat')):
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
