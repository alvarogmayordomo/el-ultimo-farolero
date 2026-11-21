# Reglas de `src/game`

Escenas y objetos de Phaser 4. Estas reglas se suman a las del `CLAUDE.md` raíz cuando trabajes aquí.

- **Aquí no se deciden reglas**: solo se dibuja, se lee el teclado y se llama a `src/core`. Si aparece un `if` que decide daño, tiempos o estados, probablemente va en `src/core` con un test.
- **Phaser 4, no 3.** Comprueba cada API en `node_modules/phaser/types/phaser.d.ts`. Ya conocidas: `setTint(c).setTintMode(TintModes.FILL)` en vez de `setTintFill`, `RenderTexture.render()` tras dibujar, `createLayer` puede devolver una capa GPU.
- **Escenas:** `Boot → Preloader → MainMenu → Game (+ Hud encima) → GameOver / Victoria`, y `Pausa` y `Creditos` aparte. La partida en curso vive en `this.registry` (`partidaEnCurso` en `scenes/Game.ts`).
- **Textos** con `estiloTexto` de `estilo.ts` (fuente del pack). Menús con `crearMenu` de `Menu.ts`.
- **Sprites nuevos** se cargan en `Preloader` y se registran en `assets.manifest.json`; si no, `npm test` falla.
- Un enemigo nuevo **no** necesita código: usa la skill `/nuevo-enemigo`.
