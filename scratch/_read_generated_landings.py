import os
import glob

directory = r"D:\UserFiles\Desktop\부동산ai"
html_files = glob.glob(os.path.join(directory, "landing_page*.html"))

print(f"Found {len(html_files)} generated HTML files:")

for path in html_files:
    print(f"\n========================================\nFile: {path}")
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            # print first 500 chars and search for some tags
            lines = content.splitlines()
            title_line = ""
            for line in lines:
                if "<title>" in line:
                    title_line = line
                    break
            print(f"Title: {title_line}")
            # Print body text snippets or links
            for line in lines:
                if 'href="tel:' in line or 'href="sms:' in line or 'class="btn' in line or 'btn-blog' in line or 'blog.naver' in line or '224362005757' in line:
                    print(f"  Link line: {line.strip()}")
    except Exception as e:
        print(f"Error reading {path}: {e}")
