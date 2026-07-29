<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Workflow: commits y changelog

Después de completar cada cambio (feature, fix, refactor):

1. Agregar una entrada a `CHANGELOG.md` bajo la fecha actual (formato `## YYYY-MM-DD`, con subsecciones `### Added` / `### Fixed` / `### Docs` según corresponda), describiendo el cambio en español, siguiendo el estilo de las entradas existentes.
2. Crear un commit de git con un mensaje descriptivo (en inglés, estilo Conventional Commits: `feat:`, `fix:`, `docs:`, etc.) que incluya ese cambio junto con la entrada del changelog.

No es necesario pedir confirmación para el commit en sí; se asume aprobado por esta instrucción. Sigue aplicando el resto del protocolo de seguridad de git (no usar `--force`, `--no-verify`, `git add -A`, etc., y revisar `git status`/`git diff` antes de confirmar).
