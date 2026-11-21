// Genera CREDITS.md a partir de assets.manifest.json (npm run creditos).
// Lista cada fuente de recursos con sus autores y licencia, los archivos que se usan
// de ella y los avisos de licencia del software incluido en el juego publicado.
import { readFileSync, writeFileSync } from 'node:fs';

const manifiesto = JSON.parse(readFileSync('assets.manifest.json', 'utf8'));

const lineas = [
    '# Créditos de El Último Farolero',
    '',
    '> Archivo generado con `npm run creditos` a partir de `assets.manifest.json`. No lo edites a mano.',
    '',
    'Diseño y dirección: Álvaro. Código: Claude Code.',
    '',
    '## Arte, fuente y efectos',
    ''
];

for (const [id, fuente] of Object.entries(manifiesto.fuentes)) {
    const recursos = manifiesto.recursos.filter((r) => r.fuente === id);
    lineas.push(
        `### ${fuente.nombre}`,
        '',
        `- Autores: ${fuente.autores.join(', ')}`,
        `- Licencia: ${fuente.licencia}`,
        `- Enlace: ${fuente.url}`,
        `- Prueba de la licencia: \`${fuente.prueba}\``,
        '',
        '| Archivo del juego | Original en el pack |',
        '| --- | --- |',
        ...recursos.map((r) => `| \`${r.archivo}\` | \`${r.original}\` |`),
        ''
    );
}

lineas.push(
    '## Software',
    '',
    '- **Phaser 4** (Phaser Studio Inc.), licencia MIT.',
    '- **Plantilla template-vite-ts** (Phaser Studio Inc.), licencia MIT: `docs/licencias/`.',
    '- **Zod** (Colin McDonnell), licencia MIT.',
    '',
    'Los textos completos de las licencias MIT están en cada paquete de `node_modules/` y en `docs/licencias/`.',
    ''
);

writeFileSync('CREDITS.md', lineas.join('\n'));
console.log(`CREDITS.md: ${manifiesto.recursos.length} recursos de ${Object.keys(manifiesto.fuentes).length} fuentes`);
