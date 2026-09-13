import os

folder = r"C:\Users\Admin\Desktop\부동산ai\기타 프로그램 보관"
keywords = ["meta_lead_collector", "notify_lead_instant", "lead_db"]
results = []

if os.path.exists(folder):
    for root, dirs, files in os.walk(folder):
        for file in files:
            if file.endswith('.py'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        matches = [k for k in keywords if k in content]
                        if matches:
                            results.append((path, matches))
                except Exception as e:
                    pass

print("Files calling meta_lead_collector:")
for path, matches in results:
    print(f" - {path} ({matches})")
