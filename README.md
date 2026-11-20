# El Último Farolero

RPG de acción 2D para el navegador, hecho con Phaser 4 y TypeScript. Eres el último farolero de un reino tragado por la Penumbra: la Luz es a la vez tu maná, tu radio de visión y tu reloj.

Proyecto en desarrollo (MVP: zona 1).

## Cómo arrancarlo

Necesitas Node.js 26 LTS.

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:8080
npm run build      # comprueba tipos y genera la versión publicable en dist/
npm run typecheck  # solo comprueba tipos
```

## Estructura

- `src/game/`: escenas de Phaser.
- `public/assets/`: arte y sonido.
- `docs/decisiones/`: decisiones del proyecto (versiones, etc.).

## Créditos y licencias

Basado en la plantilla oficial [template-vite-ts](https://github.com/phaserjs/template-vite-ts) de Phaser Studio (licencia MIT, ver `docs/licencias/plantilla-phaser-MIT.txt`).
