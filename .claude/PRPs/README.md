# Sistema PRP (Product Requirements Proposal)

> **Contrato humano-IA antes de escribir codigo**

## Anatomia de un PRP

| Seccion | Proposito | Responsable |
|---------|-----------|-------------|
| **Objetivo** | Que se construye (estado final) | Humano define |
| **Por Que** | Valor de negocio | Humano define |
| **Que** | Comportamiento + criterios de exito | Humano + IA |
| **Contexto** | Docs, referencias, gotchas | IA investiga |
| **Blueprint** | Fases de implementacion | IA genera |
| **Validacion** | Tests, linting, verificacion | IA ejecuta |

## Flujo de Trabajo

```
1. Humano: "Necesito [feature]"
2. IA: Investiga si es necesario
3. IA: Genera PRP-XXX-nombre.md
4. Humano: Revisa y aprueba
5. IA: Ejecuta Blueprint fase por fase
6. IA: Documenta en changelog/
```

## Estructura

```
PRPs/
├── README.md              # Este archivo
├── templates/
│   └── prp_base.md       # Template para nuevos PRPs
├── changelog/
│   └── YYYY-MM-DD-PRP-XXX.md
└── PRP-XXX-*.md          # PRPs activos
```

## Nomenclatura

- Archivos: `PRP-[NUMERO]-[descripcion-kebab].md`
- Estados: `PENDIENTE` → `APROBADO` → `EN PROGRESO` → `COMPLETADO`

## Stack (Golden Path)

| Capa | Tecnologia |
|------|------------|
| Framework | Next.js 16 + React 19 + TypeScript |
| Estilos | Tailwind CSS 3.4 |
| Backend | Supabase (Auth + DB) |
| Testing | Playwright MCP |
