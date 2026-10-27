#!/usr/bin/env python3
"""Copy reusable studio configuration into a project. Existing files are never overwritten unless --force."""
import argparse, shutil
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
ITEMS = ['AGENTS.md', '.agents', '.codex', 'docs/TOOLS.md', 'docs/STATE.md', 'templates/PROJECT.md', 'tools/registry.json', 'tools/doctor.py']

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('destination', type=Path)
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    dest = args.destination.expanduser().resolve()
    if dest == ROOT or ROOT in dest.parents:
        parser.error('Destination must be outside this starter directory.')
    for rel in ITEMS:
        src = ROOT / rel
        if src.is_dir():
            for f in src.rglob('*'):
                if not f.is_file(): continue
                target = dest / rel / f.relative_to(src)
                copy(f, target, args.force, args.dry_run)
        else: copy(src, dest / rel, args.force, args.dry_run)

def copy(src, dst, force, dry):
    if dst.exists() and not force:
        print('SKIP ', dst)
        return
    print('WOULD COPY' if dry else 'COPY ', dst)
    if not dry:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
if __name__ == '__main__': main()
