# Reglas de `src/core`

Lógica pura del juego. Estas reglas se suman a las del `CLAUDE.md` raíz cuando trabajes aquí.

- **Nunca importes Phaser** ni nada del navegador (`window`, `document`, `localStorage`). Si una regla necesita algo de Phaser, la parte de Phaser va en `src/game` y aquí solo llegan números.
- **Tiempos en ms y distancias en px**, siempre recibidos como parámetro (`ahora`, `distancia`). Nada de `Date.now()` ni temporizadores: así los tests controlan el tiempo.
- **Cada regla nueva lleva su test** en `<archivo>.test.ts`, al lado. Escribe primero el test que falla.
- **Daño:** siempre con `calcularDano` (`dano.ts`). No reescribas la fórmula.
- **Máquinas de estados** (`sombra.ts`, `arquero.ts`, `guardiana.ts`): un `estado`, un `actualizar(ahora, …)` que devuelve si ha cambiado o un evento, y los números en una configuración (que viene de `src/data` si es un enemigo normal).
- Las constantes con nombre en MAYÚSCULAS y un comentario que diga su unidad.
