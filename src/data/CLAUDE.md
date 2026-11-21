# Reglas de `src/data`

Datos del juego en JSON, validados con Zod. Estas reglas se suman a las del `CLAUDE.md` raíz cuando trabajes aquí.

- **Cada JSON tiene su esquema** en `esquemas.ts` y se valida al importarlo en `datos.ts`. Un campo nuevo se añade primero al esquema.
- **Ids** en minúsculas, sin tildes y con guiones (`gran-espada`). El id de un enemigo u objeto es también el nombre del objeto en Tiled.
- `enemigos.json`: `comportamiento` es `cuerpo` (Sombra, Bruto) o `distancia` (Arquero). `olvido` debe ser mayor que `deteccion`.
- `niveles.json`: en orden de juego; el último con `"jefe": true`. Cada `mapa` es `public/assets/mapas/<mapa>.tmj`.
- Tras cambiar un número, `npm test` comprueba los esquemas y que existan los archivos que nombran.
