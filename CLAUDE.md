# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

«El Último Farolero»: RPG de acción 2D cenital para el navegador, con Phaser 4 y TypeScript. El plan completo, congelado, está en `docs/plan.md`: consúltalo antes de decidir alcance, mecánicas o herramientas. Las versiones instaladas están en `docs/decisiones/0001-versiones.md`.

El objetivo real del proyecto es que Álvaro aprenda Claude Code: él dirige, revisa y prueba; Claude escribe el código. Habla siempre en español.

## Comandos

```bash
npm run dev        # servidor de desarrollo en http://localhost:8080 (recarga en caliente)
npm run build      # tsc --noEmit + build de producción en dist/
npm run typecheck  # solo comprobación de tipos
npm run preview    # sirve dist/ para probar la build
```

Aún no hay tests, linter ni formateador: Vitest llega en H2, Biome en H3, Zod en H4 y Playwright en H6 (versiones en `docs/plan.md`). Para comprobar un cambio hoy: `npm run build` y abrir el juego.

En el panel de navegador de la app de escritorio, el servidor se arranca con la configuración `juego` de `.claude/launch.json`.

## Phaser 4, no Phaser 3

- Phaser está fijado en **4.2.1 exacta**. Gran parte del código de Phaser que circula es de Phaser 3: comprueba que cada API existe en Phaser 4 (los tipos en `node_modules/phaser/types/` son la referencia) y que `npm run build` pasa.
- Si una técnica no funciona en Phaser 4, avísalo en vez de improvisar. El plan B (pasar a Phaser 3) lo decide Álvaro, no Claude.

## Arquitectura

Hoy el código es la plantilla oficial `template-vite-ts` sin modificar: `index.html` → `src/main.ts` → `src/game/main.ts` (configuración del juego y lista de escenas) → escenas en `src/game/scenes/` encadenadas con `this.scene.start()`: `Boot` (carga lo mínimo) → `Preloader` (barra de carga y assets) → `MainMenu` → `Game` → `GameOver`. Los assets se sirven desde `public/assets/` y se cargan con rutas relativas a esa carpeta.

Estructura objetivo (decisión del plan; respétala al añadir código):

- `src/core/`: lógica pura del juego, **sin importar Phaser**, con tests (Luz, daño, experiencia, IA de enemigos…).
- `src/game/`: escenas de Phaser, que solo dibujan, leen la entrada y llaman a `src/core`.
- `src/data/`: JSON de enemigos, objetos y niveles, validados con Zod.
- `src/platform/`: guardado (una partida en `localStorage`).

Decisiones técnicas fijadas en el plan:

- Lienzo de 640×360, cámara del juego con zoom ×2 (vista de 320×180) y HUD a 640×360. La plantilla aún usa 1024×768.
- Mapas de Tiled con baldosas de 16 px.
- Oscuridad: textura negra a pantalla completa en la que cada fotograma se abre un círculo degradado en el jugador y en cada brasero, según la Luz.
- Daño: `ATQ × multiplicador × 100 / (100 + DEF)`, siempre con esta fórmula.

## Reglas de trabajo

- **Alcance:** solo lo del MVP de `docs/plan.md`. No añadas nada de la lista «lo que no se hace» ni actualices dependencias. Si algo nuevo parece necesario, propónlo antes.
- **Tras cada hito** (F0, H1…H6): explica a Álvaro en lenguaje llano qué ha cambiado y por qué.
- **Pruebas de comprensión:** cuando Álvaro diga que va a arreglar un fallo él solo, explica pero no escribas código.
- **Assets:** solo CC0 o CC-BY. Cada recurso nuevo se registra con su licencia (más adelante en `assets.manifest.json`). La licencia MIT de la plantilla está en `docs/licencias/`.
- **Seguridad:** no ejecutes `curl`/`wget` ni instales paquetes sin preguntar; no hagas `git push --force`. Las reglas de `.claude/settings.json` usan `Bash(...)` y no cubren la herramienta PowerShell: aplícalas igualmente.

## Entorno

Windows 11 nativo (sin WSL), PowerShell 5.1. Los hooks se escriben en Node, no en bash. Repositorio: `alvarogmayordomo/el-ultimo-farolero` (público). Los finales de línea se normalizan a LF con `.gitattributes`.
