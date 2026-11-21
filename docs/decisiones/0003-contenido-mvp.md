# 0003 — Contenido y números del MVP (H4-H6)

Fecha: 2026-11-21 · Estado: aceptada, pendiente de balancear jugando

## Contexto

Álvaro pidió terminar H4, H5 y H6 de una vez y sin supervisión. Se saltaron la Decisión A y las pruebas de comprensión de esos hitos (ver `docs/aprendizaje.md`). Estos son los números elegidos; todos se cambian en un solo sitio.

## Enemigos (`src/data/enemigos.json`)

| Enemigo | Sprite | PV / ATQ / DEF | Exp. | Comportamiento |
| --- | --- | --- | --- | --- |
| Sombra | Spirit | 30 / 12 / 0 | 10 | Persigue, avisa 0,45 s y embiste. Un golpe la aturde |
| Arquero | Skeleton (Walk) | 24 / 11 / 0 | 15 | Se mantiene a 44-110 px, apunta 0,7 s y dispara (130 px/s, 170 px) |
| Bruto | Cyclope ×1,5 | 90 / 24 / 15 | 35 | Lento, avisa 0,8 s y embiste. Los golpes **no** le cortan el ataque |

El Bruto entra en el MVP: la regla de las 35 h no se pudo aplicar porque no hay horas apuntadas.

## Farolero (`src/core/experiencia.ts`, `equipo.ts`, `pociones.ts`)

- Nivel 1: 100 PV, 10 ATQ, 5 DEF. Cada nivel: +15 PV, +2 ATQ, +2 DEF y se cura del todo. Máximo nivel 5.
- Experiencia total para los niveles 2-5: 40, 100, 190 y 310. Los dos primeros niveles dan unos 290 de experiencia, así que se llega al jefe en el nivel 4 o 5.
- Objetos: Katana (arma, ATQ +4), Amuleto de ámbar (talismán, DEF +8), Gran espada (arma, ATQ +9). Se equipan solos si suman más ATQ + DEF que el actual.
- Pociones: hasta 3; curan 40 PV (tecla Q).

## La Guardiana del Pozo (`src/core/guardiana.ts`, `src/game/objetos/Guardiana.ts`)

- 420 PV, 22 ATQ, 20 DEF; da 100 de experiencia.
- Zarpazo en arco de 120° y 40 px (×1,2) si el farolero está cerca; si no, salto con marca roja en el suelo (×1,6, radio 30 px). En el aire no recibe daño.
- Fase 2 (50 % de PV): todo un 30 % más rápido, apaga los braseros al entrar y cada 14 s, y encender uno la aturde 2,6 s.
- Durante la pelea, encender braseros no guarda la partida (el jefe no se guarda a medias).

## Niveles (`src/data/niveles.json`)

1. **La calle de los faroles** (64×28 baldosas): de izquierda a derecha, 3 braseros.
2. **Las criptas** (48×40): de arriba abajo, 3 braseros.
3. **El Pozo** (30×22): la sala del jefe, con un brasero en cada esquina y otro en la entrada.

## Guardado

Una partida en `localStorage`, al encender un brasero. Al morir se vuelve a lo guardado, pero las caídas, los enemigos vencidos y el tiempo siguen contando. Lo recogido después de guardar vuelve a su sitio. Al ganar se borra la partida.
