#!/usr/bin/env python3
"""Offline, read-only capability hints. Not a live connectivity or permissions test."""
import argparse, json, os, shutil, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
HOME = Path.home()
COMMANDS = ['codex', 'node', 'npm', 'yarn', 'pnpm', 'git', 'gh', 'playwright-cli', 'vercel', 'supabase', 'python3']

def safe_version(cmd):
    try:
        cp = subprocess.run([cmd, '--version'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=3, check=False)
        return (cp.stdout.strip().splitlines() or ['unknown'])[0][:120]
    except (OSError, subprocess.TimeoutExpired):
        return 'unavailable'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()
    commands = {name: {'found': bool(shutil.which(name)), 'path': shutil.which(name), 'version': safe_version(name) if shutil.which(name) else None} for name in COMMANDS}
    files = [ROOT / 'AGENTS.md', ROOT / '.codex' / 'config.toml', HOME / '.codex' / 'config.toml']
    configs = [{'path': str(p), 'exists': p.is_file()} for p in files]
    skill_roots = [ROOT / '.agents' / 'skills', HOME / '.agents' / 'skills']
    skills = {str(d): sorted(p.parent.name for p in d.glob('*/SKILL.md')) if d.is_dir() else [] for d in skill_roots}
    found_mcp_config = []
    for p in files[1:]:
        if p.is_file():
            try:
                data = p.read_text(errors='replace')
                if '[mcp_servers.' in data:
                    found_mcp_config.append(str(p))
            except OSError:
                pass
    report = {'note': 'Offline hints ONLY. Does not authenticate, connect or exercise MCP/plugin tools.', 'commands': commands, 'configs': configs, 'skills': skills, 'mcp_config_files_with_entries': found_mcp_config}
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print('AI Project Studio v4 — offline capability check')
        for n, x in commands.items(): print(f"  {'✓' if x['found'] else '·'} {n:16} {x['version'] or 'not on PATH'}")
        print('Skills:', ', '.join(skills[str(skill_roots[0])]) or '(none local)')
        print('MCP config files containing entries:', ', '.join(found_mcp_config) or '(none detected)')
        print('NOTE: availability and permissions must be verified within Codex.')
if __name__ == '__main__': main()
