import os

directory = r"D:\UserFiles\Desktop\부동산ai"
keywords = ["webhook", "lead", "facebook", "graph.facebook", "양식"]
results = []

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.py') or file.endswith('.bat'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    matches = [k for k in keywords if k in content.lower()]
                    if matches:
                        results.append((path, matches))
            except Exception as e:
                pass

print("Files matching lead webhook/collection keywords:")
for path, matches in results:
    print(f" - {path} (matches: {matches})")
