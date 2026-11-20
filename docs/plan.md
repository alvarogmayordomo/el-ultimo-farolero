# El Último Farolero — Plan del proyecto (v1.0)

Nov 20, 2026 · @Alvaro

## Resumen y decisiones

Vas a hacer «El Último Farolero», un RPG de acción 2D de fantasía para el navegador, con Phaser 4 y TypeScript, con un objetivo: aprender Claude Code. El MVP recortado son unas 40-60 h tuyas, unas 9-12 semanas a 5-6 h por semana. Claude escribe el código; tú diriges, revisas y pruebas.

La planificación queda congelada en este documento. El primer commit debe hacerse como tarde el 27 de noviembre de 2026.

| Tema | Decisión | Por qué |
| --- | --- | --- |
| Concepto | El Último Farolero: la Luz es maná, radio de visión y reloj | El gancho cuesta poco (una variable y una capa de oscuridad) y la oscuridad disimula el arte provisional |
| Motor | Phaser 4.2.1 (versión fija) con TypeScript | Todo es texto que Claude puede leer y comprobar, y el navegador es su destino natural. Investigador y arquitecto coinciden. Plan B: Phaser 3 |
| Unity y Godot | Descartados para este proyecto | Gran parte del trabajo pasa por un editor visual que Claude maneja peor. A Unity te llevas lo aprendido de Claude Code, no el motor |
| Mapas | Tiled, con baldosas de 16 px | Phaser carga su formato directamente |
| Resolución | Lienzo de 640×360 con la cámara del juego a zoom ×2 (vista de 320×180) y el HUD a 640×360 | Corrige una contradicción detectada en la revisión. Se valida en H1 con una captura a 1920×1080 |
| Arte y sonido | Ninja Adventure, más los packs de Kenney (CC0, gratis) | Un único estilo coherente a 16 px. Se puede publicar e incluso vender |
| Entorno | Windows nativo, sin WSL | La integración de Claude Code con Chrome no funciona en WSL |
| Esfuerzo | MVP de 40-60 h tuyas, con el alcance recortado | Sin los recortes, la revisión lo estimaba en 60-85 h |

## Concepto del juego

Eres el último farolero de un reino tragado por la Penumbra y avanzas encendiendo braseros. Todo gira alrededor de la Luz, un valor de 0 a 100:

- Las habilidades gastan Luz.
- El radio que ves va de 48 px (Luz 0) a 160 px (Luz 100).
- Con la Luz a 0 pierdes 3 PV por segundo por el frío.
- Recuperas Luz golpeando enemigos (+2 por golpe) y en los braseros, que además guardan la partida.

El combate es en tiempo real, con vista cenital. Tienes un combo de 3 golpes, una esquiva de 0,3 s (invulnerable durante 0,2 s) y la habilidad Lanza de Luz. El daño se calcula siempre con la misma fórmula: ATQ × multiplicador × 100 / (100 + DEF).

El jefe de la zona 1, la Guardiana del Pozo, tiene 2 fases. En la primera ataca con un zarpazo en arco y un salto que marca en el suelo dónde va a caer. En la segunda apaga los braseros de la sala; si los vuelves a encender, la aturdes.

El diseño completo (6 enemigos, 3 jefes, talentos y economía) queda para la versión 1.0.

## Alcance del MVP

El MVP es la zona 1 completa: 2 niveles y la sala del jefe, hechos en Tiled.

**Está terminado cuando:** otra persona abre el enlace, juega hasta el jefe sin que nadie le explique nada, muere, cierra el navegador y al volver continúa desde el último brasero.

**Qué incluye:**

- Combo de 3 golpes, esquiva, Lanza de Luz y pociones.
- El sistema de Luz completo.
- Dos enemigos, la Sombra y el Arquero. El Bruto, solo si da tiempo.
- Subida de nivel por experiencia, como máximo hasta el nivel 5.
- 3 objetos, que se equipan solos al recogerlos si son mejores.
- Guardado en los braseros: una sola partida, en el navegador.
- Menús mínimos: título (Continuar, Nueva, Créditos), pausa, «Has caído» y pantalla de victoria con estadísticas.

**Recortes respecto al diseño original:** el tercer nivel, la habilidad Destello, las ascuas, 6 de los 9 objetos, la tarjeta para comparar objetos, el selector de niveles y una fase del jefe (la de invocar enemigos).

**Regla automática:** si la Entrega A pasa de 35 h reales, el Bruto sale del MVP y pasa a la 1.0.

**Lo que no se hace durante el MVP:**

- multijugador, mundo abierto, niveles generados automáticamente, varias clases de personaje, diálogos con ramas;
- inventario completo, propiedades de objetos aleatorias;
- cambiar de motor;
- actualizar dependencias;
- comprar packs o herramientas antes de terminar la Entrega A.

## Hoja de ruta

Son 7 etapas en unas 12 semanas. Cada hito termina con algo jugable y añade una sola función nueva de Claude Code, para no saturar. Las horas son estimaciones de los agentes, con un margen de ±30 %.

| Etapa | Semanas | Horas | Qué avanza en el juego | Qué aprendes de Claude Code |
| --- | --- | --- | --- | --- |
| F0 Preparación | 1 | \~5 | Instalar el entorno, arrancar la plantilla de Phaser, apuntar las versiones, quitar el aviso anónimo de la plantilla (`log.js`), revisar qué sprites trae el pack y hacer el primer commit | Iniciar sesión (`/login`), modos de permiso, `settings.json`, `/init` y CLAUDE.md |
| H1 | 2-3 | 6-8 | El personaje se mueve por un mapa de Tiled con colisiones y cámara. Prueba de 1 sesión de la capa de oscuridad | Plan mode, commits, leer diffs, `/rewind` |
| H2 | 3-4 | 6-8 | Combo, esquiva y la Sombra con su lógica de comportamiento | Tests con Vitest (que un test falle y luego pase), `/clear` y `/context` |
| H3 | 5-6 | 6-8 | Sistema de Luz, Lanza de Luz y braseros. Primer nivel publicado en GitHub Pages | Un hook de formato escrito en Node e integración con Chrome |
| Decisión A | 6 | — | ¿Es divertido el núcleo? ¿Funciona Phaser 4 con Claude? ¿Estás aprendiendo? Si no, se ajusta con datos, no por aburrimiento | Repasar el registro de aprendizaje |
| H4 | 7-8 | 6-8 | El Arquero (y el Bruto, si cabe) cargados desde JSON validados, experiencia, objetos y pociones | Skill propia `/nuevo-enemigo` |
| H5 | 9-10 | 6-8 | Los 2 niveles y la sala del jefe, guardado, menús, HUD y pantalla de créditos | Subagente que solo explica o revisa, sin tocar código, y reglas por carpeta |
| H6 | 11-12 | 6-10 | El jefe, el balanceo y la publicación final | Ramas, PR y pruebas automáticas en GitHub Actions |

**Para después del MVP:** worktrees, subagente de balanceo, la app de GitHub, modo sin interfaz (`claude -p`), hooks que bloquean el final de una tarea, la versión 1.0 (zonas 2 y 3, talentos, tienda, mando) y el ejecutable de escritorio (Tauri o Electron). Se decide al cerrar el MVP.

## Stack técnico y entorno

Se usan versiones fijas y probadas, no las más nuevas, y no se actualiza nada durante el MVP. Tras instalar, las versiones reales se apuntan en `docs/decisiones/0001-versiones.md`.

| Pieza | Para qué sirve | Versión |
| --- | --- | --- |
| [Phaser](https://phaser.io/download/stable) | Motor del juego | 4.2.1 exacta |
| TypeScript | El lenguaje: JavaScript con tipos, que detecta errores antes de ejecutar | La de la plantilla o la 6.0.3. Nunca la 7 durante el MVP |
| Vite | Arranca el juego en el navegador mientras desarrollas y prepara la versión publicable | La de la plantilla (6.x) |
| Node.js | El entorno que ejecuta todas las herramientas | 26 LTS |
| Vitest | Tests de la lógica del juego, sin dibujar nada | 5.1.1 |
| Playwright | Abre el juego en un navegador sin ventana para comprobarlo automáticamente | 1.65.1 |
| Biome | Formato y revisión del estilo del código | 2.6.x |
| Zod | Valida los JSON de enemigos, objetos y niveles | 4.x |
| Tiled | Editor de mapas | 1.12 |
| Git for Windows, GitHub y `gh` | Historial de cambios, copia en la nube y publicación | Las actuales |

La base es la plantilla oficial [create-game de Phaser](https://github.com/phaserjs/create-game). La documentación de Phaser para agentes ([skills de Phaser 4](https://phaser.io/agent/mcp/claude-code)) se copia a mano en el proyecto y se cita en el CLAUDE.md, para que Claude no escriba código de Phaser 3.

El código se organiza así:

- `src/core`: la lógica pura del juego, sin Phaser, con tests.
- `src/game`: las escenas de Phaser.
- `src/data`: los JSON validados.
- `src/platform`: el guardado.

**Oscuridad:** una textura negra que tapa la pantalla y en la que, cada fotograma, se abre un círculo degradado en el jugador y en cada brasero, según la Luz que haya. Esta técnica funciona igual en Phaser 3 y en Phaser 4.

**Entorno:** Windows nativo con VS Code y Git for Windows. Los hooks se escriben en Node, no en bash.

## Seguridad y permisos

En Windows, Claude Code no trabaja dentro de un entorno aislado. Los permisos se van abriendo poco a poco:

| Etapa | Modo de permisos |
| --- | --- |
| F0 | `default`: pregunta antes de cada acción |
| Entrega A | `acceptEdits`: edita archivos sin preguntar |
| Entrega B | `auto`, manteniendo las listas de abajo |
| Nunca | `bypassPermissions` en tu PC personal |

**Reglas básicas:**

- **Rama `main` protegida en GitHub.** Publicar en `main` despliega la web, así que todo pasa antes por una PR que revisas tú.
- **Un perfil de Chrome solo para desarrollo.** La integración con Chrome usa tu sesión real del navegador.
- **Nada de código de terceros sin revisar.** Las skills de terceros se copian a mano tras leerlas, nunca se instalan con `npx -y`.
- **Hooks en Node, revisados por ti línea a línea.** Editar `.claude/` siempre pide confirmación.
- **Sin secretos.** El proyecto no los necesita: `.env*` está bloqueado y en `.gitignore`.

**Las reglas para `.claude/settings.json`**, con los permisos de la Entrega A, son estas (el modo de cada etapa está en la tabla de arriba):

```json
{
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": ["Bash(npm run *)", "Bash(git status)", "Bash(git diff *)", "Bash(git log *)", "Bash(git add *)", "Bash(git commit *)", "Bash(git switch *)", "Bash(git branch *)"],
    "ask": ["Bash(git push *)", "Bash(git reset *)", "Bash(git rebase *)", "Bash(git checkout *)", "Bash(npm install *)", "Bash(npm i *)", "Bash(npm uninstall *)", "Bash(npx *)", "Bash(gh *)", "Bash(rm *)", "Bash(node *)", "Edit(./.claude/**)", "Edit(./.github/**)", "Edit(./package.json)", "Edit(./CLAUDE.md)", "WebFetch"],
    "deny": ["Read(./.env)", "Read(./.env.*)", "Bash(git push --force *)", "Bash(git push -f *)", "Bash(gh auth *)", "Bash(gh secret *)", "Bash(gh repo delete *)", "Bash(npm publish *)", "Bash(curl *)", "Bash(wget *)"]
  }
}
```

Primero se mira si la acción está prohibida, luego si requiere confirmación y por último si está permitida. Por eso lo que quieras ejecutar sin que pregunte debe ir en scripts de `npm run`. Estas reglas reducen el riesgo, pero no sustituyen a leer los cambios ([documentación de permisos](https://code.claude.com/docs/en/permissions)).

## Arte, sonido y licencias

Todo el arte y el sonido del MVP son gratis y con licencia CC0: se puede publicar y vender sin dar crédito. Aun así, el juego llevará créditos.

| Recurso | Qué aporta | Licencia |
| --- | --- | --- |
| [Ninja Adventure Asset Pack](https://pixel-boy.itch.io/ninja-adventure-asset-pack) | Personajes, monstruos y jefes animados, baldosas, interfaz, efectos, sonidos y 25 pistas de música, todo a 16 px | CC0 |
| [Kenney UI Pack RPG Expansion](https://kenney.nl/assets/ui-pack-rpg-expansion) | 85 elementos de interfaz | CC0 |
| [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio) | 50 efectos de sonido | CC0 |
| jsfxr (sfxr.me) | Generador de efectos de sonido propios | Uso libre |

**La pega del pack principal:** Ninja Adventure es de fantasía oriental, de estilo Zelda. La capa de oscuridad y un tono de color reducen el choque con la ambientación del juego. Se acepta para el MVP. Plan B: [Kenney Tiny Dungeon](https://kenney-assets.itch.io/tiny-dungeon) y 0x72 DungeonTileset II, también CC0.

**Reglas:**

- **Antes de cerrar la lista de enemigos (F0):** comprobar qué sprites y animaciones trae de verdad el pack.
- **Qué se sube al repositorio:** solo arte y sonido CC0 o CC-BY. Los packs de pago suelen prohibir redistribuirlos, y el repositorio es público.
- **Prueba de cada licencia:** guardar el `LICENSE` del zip y una captura fechada de la página de descarga.
- **Fuentes tipográficas:** revisar las del pack. Si hay dudas, usar una con licencia OFL.
- **Créditos:** el archivo `assets.manifest.json` registra cada recurso con su licencia. De él se generan `CREDITS.md` y la pantalla de créditos, que también incluye los avisos MIT de Phaser y del resto de dependencias.
- **Validación:** un comprobador hace fallar la compilación si algún recurso no tiene su licencia registrada. Es un buen ejercicio con Claude Code.
- **IA generativa:** no se usa para sprites, salvo como marcadores provisionales.

## Cómo medir lo aprendido

Tener un juego terminado no demuestra que hayas aprendido. Por eso el aprendizaje se mide en cada hito, y no solo al final.

1. **Registro (`docs/aprendizaje.md`):** 3 líneas por sesión (qué función has usado, qué ha fallado y qué harías distinto) y las horas reales de cada hito.
2. **Explicación de Claude tras cada hito:** qué ha cambiado y por qué, en lenguaje llano. Es una regla fija del CLAUDE.md.
3. **Prueba de comprensión en cada hito:**
   - Escribes tú el plan del hito siguiente.
   - Explicas en 5 líneas cómo fluyen los datos en el sistema nuevo, y Claude te corrige.
   - Una vez por entrega, arreglas un fallo sin que Claude escriba código; solo puede explicarte.
4. **Lo que deberías saber hacer al cerrar el MVP:**
   - escribir una skill (`SKILL.md`) desde cero;
   - escribir una regla de permisos;
   - deshacer un commit;
   - leer un diff de 100 líneas y señalar un error;
   - explicar por qué la lógica del juego va separada de las escenas de Phaser.

## Riesgos y reglas contra el abandono

Lo más probable no es un fallo técnico, sino que el proyecto se deje. Las reglas de cadencia importan tanto como el código.

| Riesgo | Qué se hace |
| --- | --- |
| Planificar en lugar de ejecutar | La planificación se congela aquí. Primer commit como tarde el 27 de noviembre de 2026 |
| Perder el ritmo | Al menos 2 sesiones por semana de 2 h o más, y cada una termina con algo jugable o un test pasando. Si pasan 2 semanas sin sesión, se recorta el alcance; no se vuelve a planificar |
| El alcance crece y los plazos se disparan (en juegos indie, entre 4 y 10 veces lo previsto es habitual) | Recortes del MVP, lista de lo que no se hace y regla automática del Bruto |
| Claude escribe código de Phaser 3 | Versión fijada, documentación de Phaser 4 en el CLAUDE.md y prueba de la oscuridad en H1. Si falla, se pasa a Phaser 3 |
| Delegarlo todo y no entender el código | Pruebas de comprensión en cada hito |
| Proyectos personales en paralelo | Recomendación: este como proyecto principal hasta el punto de decisión A, y el juego de zombis en pausa hasta entonces. La decisión es tuya |
| Límite de uso del plan de Claude | Ver abajo |

**Límites de uso:**

- El plan Pro tiene un límite que se renueva cada 5 horas y otro semanal ([Pro plan](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan)).
- Todo lo que usas (claude.ai, Claude Code y la app de escritorio) gasta del mismo límite ([límites de uso](https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work)), así que las conversaciones largas como esta restan horas de programación.
- Usa `/usage` para ver el consumo y `/clear` entre tareas para no arrastrar el contexto ([costes en Claude Code](https://code.claude.com/docs/en/costs)).
- Si el límite frena el ritmo de forma recurrente, Max multiplica la cuota de Pro por 5 ([Max plan](https://support.claude.com/en/articles/11049741-what-is-the-max-plan)). Decídelo con el registro de horas en la mano, no antes.

## Fuentes

Este plan resume seis informes de agentes: investigación, diseño de juego, arquitectura, arte y audio, un plan consolidado y una revisión crítica independiente. La revisión comprobó en la web las versiones, las licencias y el límite de WSL.

- [Phaser: descarga de la versión estable](https://phaser.io/download/stable)
- [Phaser 3 frente a Phaser 4](https://phaser.io/news/2026/05/phaser-3-vs-phaser-4)
- [Plantilla create-game de Phaser](https://github.com/phaserjs/create-game)
- [Phaser con Claude Code](https://phaser.io/agent/mcp/claude-code)
- [Anuncio de TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [Claude Code: integración con Chrome](https://code.claude.com/docs/en/chrome)
- [Claude Code: permisos](https://code.claude.com/docs/en/permissions)
- [Claude Code: hooks](https://code.claude.com/docs/en/hooks)
- [Claude Code: skills](https://code.claude.com/docs/en/skills)
- [Claude Code: subagentes](https://code.claude.com/docs/en/sub-agents)
- [Claude Code: memoria y CLAUDE.md](https://code.claude.com/docs/en/memory)
- [Ninja Adventure Asset Pack](https://pixel-boy.itch.io/ninja-adventure-asset-pack)
- [Kenney UI Pack RPG Expansion](https://kenney.nl/assets/ui-pack-rpg-expansion)
- [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio)
