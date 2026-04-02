#!/usr/bin/env python3
"""Lê .claude/rules/*.md e grava .cursor/rules/*.mdc com frontmatter Cursor.

Globs: o Cursor interpreta melhor múltiplos padrões como lista YAML (um item por linha),
não como string com vírgulas nem como chaves {a,b}. Ver docs da comunidade / mapeamento.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RULE_DIR = ROOT / ".claude" / "rules"
OUT_DIR = ROOT / ".cursor" / "rules"

# Cada valor é uma lista de padrões minimatch (um ou mais).
GLOBS: dict[str, list[str] | None] = {
    "backend.md": ["backend/**/*.ts"],
    "frontend.md": ["frontend/**/*.ts", "frontend/**/*.tsx"],
    "ai-service.md": ["ai-service/**/*.py"],
    "clinical-domain.md": [
        "backend/src/clinical-protocols/**",
        "backend/src/oncology-navigation/**",
        "ai-service/src/agent/**",
    ],
    "database.md": ["backend/prisma/**/*"],
    "security.md": ["backend/**/*.ts"],
    "devops.md": [
        "docker-compose*.yml",
        "Dockerfile*",
        ".github/workflows/**",
    ],
    "architect.md": None,
    "aws.md": ["**/*.tf", "**/*.yml", "**/*.yaml"],
    "code-simplifier.md": None,
    "documentation.md": ["docs/**/*.md"],
    "fhir-integration.md": ["backend/src/integrations/fhir/**/*.ts"],
    "github-organizer.md": None,
    "llm-agent-architect.md": ["ai-service/src/agent/**/*.py"],
    "llm-context-engineer.md": ["ai-service/src/agent/**/*.py"],
    "performance.md": ["frontend/**", "backend/**"],
    "product-owner.md": None,
    "rag-engineer.md": ["ai-service/src/agent/rag/**/*.py"],
    "terraform.md": ["**/*.tf"],
    "test-generator.md": None,
    "ux-accessibility.md": ["frontend/**/*.tsx"],
    "whatsapp-integration.md": ["backend/src/whatsapp-connections/**/*.ts"],
}


def extract_description(content: str) -> str:
    m = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    raw = (m.group(1).strip() if m else "Regra do projeto ONCONAV")
    return raw[:240] + ("..." if len(raw) > 240 else "")


def yaml_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def append_globs(lines: list[str], patterns: list[str]) -> None:
    lines.append("globs:")
    for p in patterns:
        lines.append(f'  - "{yaml_escape(p)}"')


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src in sorted(RULE_DIR.glob("*.md")):
        body = src.read_text(encoding="utf-8")
        desc = extract_description(body)
        globs = GLOBS.get(src.name)
        lines = [
            "---",
            f'description: "{yaml_escape(desc)}"',
            "alwaysApply: false",
        ]
        if globs:
            append_globs(lines, globs)
        lines.extend(["---", "", body.rstrip() + "\n"])
        out = OUT_DIR / (src.stem + ".mdc")
        out.write_text("\n".join(lines), encoding="utf-8")
        print("OK", out.relative_to(ROOT))


if __name__ == "__main__":
    main()
