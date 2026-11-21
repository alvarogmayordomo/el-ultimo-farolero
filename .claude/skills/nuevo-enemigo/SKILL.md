---
name: nuevo-enemigo
description: Añade un enemigo nuevo a El Último Farolero a partir de un sprite de Ninja Adventure, con sus datos en src/data/enemigos.json validados por Zod. Úsala cuando Álvaro pida un enemigo nuevo o /nuevo-enemigo.
argument-hint: <id> <carpeta del monstruo en Actor/Monster> <cuerpo|distancia>
---

# /nuevo-enemigo

Añade un enemigo sin tocar la lógica del juego: los enemigos son **datos**. El Preloader carga
el sprite y crea sus animaciones leyendo `src/data/enemigos.json`, y la escena `Game` crea un
enemigo por cada objeto de Tiled cuyo nombre coincide con un id de ese JSON.

Argumentos: `$ARGUMENTS` (id en minúsculas y sin tildes, carpeta del pack, tipo de comportamiento).
Si falta alguno, pregúntalo antes de empezar.

## Pasos

1. **Sprite.** Comprueba que existe `fuentes/ninja-adventure/Actor/Monster/<Carpeta>/SpriteSheet.png`
   y que mide 64×64 (4 columnas = direcciones abajo, arriba, izquierda, derecha; 4 filas = fotogramas
   de 16×16). Si no mide eso, para y avisa: el resto del juego asume ese formato.
2. **Copia** el archivo a `public/assets/enemigos/<id>.png`.
3. **Licencia.** Añade el recurso a `assets.manifest.json` (`fuente: "ninja-adventure"` y la ruta
   original). Sin esto `npm test` falla: el test de licencias comprueba cada archivo de `public/assets`.
4. **Datos.** Añade la entrada `<id>` a `src/data/enemigos.json`. Copia la forma de un enemigo del
   mismo tipo (`sombra` o `bruto` para `cuerpo`, `arquero` para `distancia`); el esquema está en
   `src/data/esquemas.ts`. Pon números moderados y explica a Álvaro cada uno:
   - `estadisticas` (pv, atq, def). El daño siempre es `ATQ × multiplicador × 100 / (100 + DEF)`.
   - `experiencia` que da al morir.
   - `distancias` y `tiempos` (ms) de su comportamiento, y `aturdible` (si un golpe le corta el ataque).
5. **Mapa.** Coloca al menos un punto con nombre `<id>` en la capa `objetos` del nivel que diga Álvaro
   (`public/assets/mapas/*.tmj`). Mira la capa `muros` para no dejarlo dentro de una pared.
6. **Comprueba**: `npm run lint`, `npm test` y `npm run build`. Luego abre el juego (configuración
   `juego` de `.claude/launch.json`) y verifica que aparece, se anima y se puede matar.
7. **Resume** a Álvaro qué archivos has tocado y por qué no ha hecho falta escribir código.

## No hagas

- No crees una clase nueva por enemigo ni toques `src/core` salvo que pida un comportamiento que no
  sea `cuerpo` ni `distancia`. En ese caso, para y propónselo antes.
- No uses sprites de fuera de `fuentes/` ni de packs que no sean CC0 o CC-BY.
