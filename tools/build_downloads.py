"""Rebuild every download for the 1333 stilt house kit from dims.js.

Writes: SVG sheets, the full-site GLB, the plan-set PDF, the guide PDF (site layout only),
the source ZIP, and a mirror of the public repo folder.

Needs: Python 3, Node 18+ (npm), and Microsoft Edge or Google Chrome for the PDFs.

Site layout (this repo):   python irl/house/tools/build_downloads.py [--repo-dir "D:/1333 Stilt House"]
Repo layout (public repo): python tools/build_downloads.py

License: MIT. Kaiotei / 13 <33 Covenant.
"""
import argparse
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import zipfile
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
BASE = TOOLS.parent
SITE = (BASE / 'plans.js').exists()          # site layout: irl/house/*.js ; repo layout: model/*.js
SRC = BASE if SITE else BASE / 'model'
THREE = 'three@0.185.1'                      # keep equal to the importmap version on the site

BROWSERS = [
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/microsoft-edge',
]


def run(cmd, cwd=None):
    print('>', ' '.join(str(c) for c in cmd))
    subprocess.run(cmd, cwd=cwd, check=True, shell=(os.name == 'nt' and str(cmd[0]) in ('npm', 'npx')))


def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def pdf(browser, url, out, work):
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        out.unlink()
    run([browser, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--no-first-run',
         f'--user-data-dir={work / "browser-profile"}', '--run-all-compositor-stages-before-draw',
         '--virtual-time-budget=20000', f'--print-to-pdf={out}', url])
    pages = len(re.findall(rb'/Type\s*/Page[^s]', out.read_bytes()))
    print(f'  {out.name}: {pages} pages, {out.stat().st_size // 1024} KB')
    return pages


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--repo-dir', default='D:/1333 Stilt House' if SITE else None,
                    help='site layout only: folder to mirror the public repo into')
    args = ap.parse_args()

    out = BASE / 'download' if SITE else BASE
    sheets_dir = out / 'sheets' if SITE else BASE / 'plans' / 'sheets'
    glb = out / '1333-stilt-house.glb' if SITE else BASE / 'export' / '1333-stilt-house.glb'
    plans_pdf = out / '1333-stilt-house-plans.pdf' if SITE else BASE / 'plans' / '1333-stilt-house-plans.pdf'
    guide_pdf = out / '1333-stilt-house-guide.pdf'

    work = Path(tempfile.gettempdir()) / '1333-stilt-build'
    work.mkdir(exist_ok=True)
    if not (work / 'node_modules' / 'three').exists():
        (work / 'package.json').write_text('{"type":"module","private":true}\n')
        run(['npm', 'install', '--silent', THREE], cwd=work)

    # 1. SVG sheets
    run(['node', TOOLS / 'sheets.mjs', SRC / 'plans.js', sheets_dir])

    # 2. GLB (model.js needs `three`, so run it from the work folder)
    for f in ('dims.js', 'model.js'):
        shutil.copy2(SRC / f, work / f)
    shutil.copy2(TOOLS / 'glb.mjs', work / 'glb.mjs')
    glb.parent.mkdir(parents=True, exist_ok=True)
    run(['node', 'glb.mjs', glb], cwd=work)

    # 3. PDFs through a headless browser and a local server
    browser = next((b for b in BROWSERS if Path(b).exists()), None) or shutil.which('chrome') or shutil.which('msedge')
    if not browser:
        sys.exit('No Edge or Chrome found for the PDFs.')
    root = BASE.parent.parent if SITE else BASE
    port = free_port()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=root,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1.2)
        prefix = f'http://127.0.0.1:{port}/' + ('irl/house/' if SITE else '')
        n = pdf(browser, prefix + ('plans-print.html' if SITE else 'model/print.html'), plans_pdf, work)
        if n != 10:
            print(f'  WARNING: expected 10 plan pages, got {n}')
        if SITE:
            pdf(browser, prefix + 'guide.html?print=1', guide_pdf, work)
    finally:
        srv.terminate()

    if not SITE:
        print('done (repo layout)')
        return

    # 4. Repo tree, then the ZIP made from it
    stage = work / 'repo'
    if stage.exists():
        shutil.rmtree(stage)
    tree = {
        'README.md': TOOLS / 'repo' / 'README.md',
        'LICENSE': TOOLS / 'repo' / 'LICENSE',
        'LICENSE-CODE': TOOLS / 'repo' / 'LICENSE-CODE',
        'model/dims.js': BASE / 'dims.js',
        'model/model.js': BASE / 'model.js',
        'model/plans.js': BASE / 'plans.js',
        'model/print.html': BASE / 'plans-print.html',
        'plans/1333-stilt-house-plans.pdf': plans_pdf,
        'docs/1333-stilt-house-guide.pdf': guide_pdf,
        'export/1333-stilt-house.glb': glb,
        'tools/build_downloads.py': TOOLS / 'build_downloads.py',
        'tools/sheets.mjs': TOOLS / 'sheets.mjs',
        'tools/glb.mjs': TOOLS / 'glb.mjs',
    }
    for svg in sorted(sheets_dir.glob('*.svg')):
        tree[f'plans/sheets/{svg.name}'] = svg
    for rel, src in tree.items():
        dst = stage / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

    zpath = out / '1333-stilt-house-source.zip'
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
        for rel in sorted(tree):
            z.write(stage / rel, f'1333-stilt-house/{rel}')
    print(f'  {zpath.name}: {zpath.stat().st_size // 1024} KB, {len(tree)} files')

    if args.repo_dir:
        repo = Path(args.repo_dir)
        repo.mkdir(parents=True, exist_ok=True)
        for rel in tree:
            dst = repo / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(stage / rel, dst)
        print(f'  mirrored {len(tree)} files to {repo}')
    print('done')


if __name__ == '__main__':
    main()
