# 0001 — Versiones fijadas para el MVP

Fecha: 2026-11-20 · Estado: aceptada

## Decisión

Durante el MVP no se actualiza ninguna dependencia. Estas son las versiones instaladas de verdad (salida de `npm ls` y `--version`):

| Pieza | Versión instalada | Lo que pedía el plan | Notas |
| --- | --- | --- | --- |
| Phaser | 4.2.1 | 4.2.1 exacta | Fijada sin `^` en `package.json`. La plantilla traía la 4.0.0 |
| TypeScript | 5.7.3 | La de la plantilla o la 6.0.3, nunca la 7 | Rango `~5.7.2` de la plantilla |
| Vite | 6.4.6 | La de la plantilla (6.x) | Rango `^6.3.1` de la plantilla |
| Terser | 5.51.4 | — | Minifica la versión publicable |
| Node.js | 26.13.1 (LTS) | 26 LTS | Instalado con winget |
| npm | 11.20.0 | — | Viene con Node |
| Git for Windows | 2.56.1 | La actual | |
| GitHub CLI (`gh`) | 2.105.0 | La actual | Sesión de `alvarogmayordomo` |
| Tiled | 1.12.2 | 1.12 | Instalado con winget (`Tiled.Tiled`) |
| Vitest | 5.1.1 | 5.1.1 | Instalado en H2, fijado sin `^` en `package.json` |
| Biome | 2.6.6 | 2.6.x | Instalado en H3, fijado sin `^`. Se eligió la última 2.6 con más de dos semanas publicada |
| Zod | 4.6.7 | 4.x | Instalado en H4, fijado sin `^`. Valida los JSON de src/data y el guardado |
| Playwright (@playwright/test) | 1.65.1 | 1.65.1 | Instalado en H4 (con Álvaro delante) para usarlo en H6; Chromium con `npm run e2e:instalar` |

Todas las dependencias del plan están instaladas.

## Origen de la plantilla

Clonada de `phaserjs/template-vite-ts` (commit `d1d7d58`, licencia MIT de Phaser Studio) en lugar de usar `npm create @phaserjs/game`, para no enviar el aviso anónimo del instalador.

Cambios sobre la plantilla:

- Borrado `log.js`, que avisaba a un servidor externo en cada `npm run dev` y `npm run build`.
- Quitado el mensaje promocional de `vite/config.prod.mjs`.
- `npm run build` comprueba los tipos con `tsc --noEmit` antes de compilar.
- `package.json` renombrado a `el-ultimo-farolero` y marcado como `private`.

## Avisos conocidos

- npm 11 no ejecuta el script `postinstall` de `esbuild` hasta aprobarlo (`npm install-scripts approve esbuild`). Ese script solo comprueba el binario; la compilación y el servidor de desarrollo funcionan sin él.
