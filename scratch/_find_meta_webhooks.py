import os

search_dirs = [r"C:\Users\Admin\Desktop\부동산ai", r"C:\landnote_automation"]
results = []

for sdir in search_dirs:
    if os.path.exists(sdir):
        for root, dirs, files in os.walk(sdir):
            for file in files:
                if file.endswith(('.py', '.bat', '.txt')):
                    path = os.path.join(root, file)
                    try:
                        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            if "landnote_automation" in content or "meta_lead_collector" in content or "lead_db" in content:
                                results.append(path)
                    except:
                        pass

print("Files referring to landnote_automation or lead_db:")
for r in set(results):
    print(f" - {r}")
