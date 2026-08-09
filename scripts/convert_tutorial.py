#!/usr/bin/env python3
"""Convert zh-CN tutorials to zh-Hant preserving image paths."""
import re
import subprocess
import sys

files = sys.argv[1:]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()

    # Collect all image paths and mask them
    img_re = re.compile(r'!\[([^\]]*)\]\(([^)]+)\)')
    images = []
    def collect(m):
        images.append((m.group(1), m.group(2)))
        return f'![__MASKED_{len(images)-1}__](__MASKED_PATH__)'

    masked = img_re.sub(collect, content)

    # Run opencc
    proc = subprocess.run(
        ['opencc', '-c', 's2twp'],
        input=masked, capture_output=True, text=True
    )
    result = proc.stdout

    # Restore image paths
    for i, (alt, path) in enumerate(images):
        result = result.replace(
            f'![__MASKED_{i}__](__MASKED_PATH__)',
            f'![{alt}]({path})'
        )

    # Fix common opencc over-conversions
    result = result.replace('許可權', '權限')
    result = result.replace('分割槽', '分區')

    # Write to zh-Hant path
    outpath = filepath.replace('/zh-CN/', '/zh-Hant/')
    with open(outpath, 'w') as f:
        f.write(result)

    print(f'Converted: {filepath} → {outpath}')
