// Hook PostToolUse de Claude Code: formatea con Biome cada archivo que Claude edita o crea.
//
// Claude Code le pasa por la entrada estándar un JSON con la herramienta usada y sus
// parámetros (tool_input.file_path). El hook:
//   1. Ignora los archivos que Biome no revisa (imágenes, mapas, Markdown...).
//   2. Ejecuta `biome check --write` sobre ese archivo: formato, orden de imports y
//      arreglos seguros del linter.
//   3. Si quedan errores que Biome no sabe arreglar, sale con código 2: Claude Code
//      le enseña a Claude el mensaje para que lo corrija. Si no, sale con 0 en silencio.
//
// No usa paquetes externos: solo Node y el Biome instalado en node_modules.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const EXTENSIONES = new Set(['.ts', '.mts', '.js', '.mjs', '.cjs', '.json']);

function salir(codigo, mensaje) {
    if (mensaje) {
        process.stderr.write(`${mensaje}\n`);
    }
    process.exit(codigo);
}

let entrada;
try {
    entrada = JSON.parse(readFileSync(0, 'utf8'));
} catch {
    salir(0); // Sin JSON válido no hay nada que formatear
}

const archivo = entrada?.tool_input?.file_path;
if (typeof archivo !== 'string' || !EXTENSIONES.has(extname(archivo).toLowerCase())) {
    salir(0);
}

const proyecto = process.env.CLAUDE_PROJECT_DIR || entrada.cwd || process.cwd();
const biome = join(proyecto, 'node_modules', '@biomejs', 'biome', 'bin', 'biome');

if (!existsSync(biome)) {
    salir(0, 'Hook de formato: Biome no está instalado (npm install).');
}

// Ruta relativa al proyecto y con «/»: así Biome aplica los «includes» de biome.json
// (en Windows, relative() devuelve «\» y Biome no reconocería la ruta)
const ruta = relative(proyecto, archivo).replaceAll('\\', '/');
if (ruta.startsWith('..')) {
    salir(0); // Fuera del proyecto: no es asunto nuestro
}

const resultado = spawnSync(
    process.execPath,
    [biome, 'check', '--write', '--no-errors-on-unmatched', '--colors=off', ruta],
    { cwd: proyecto, encoding: 'utf8' }
);

if (resultado.error) {
    salir(0, `Hook de formato: no se ha podido ejecutar Biome (${resultado.error.message}).`);
}

if (resultado.status !== 0) {
    salir(
        2,
        `Biome ha encontrado problemas en ${ruta} que no ha podido arreglar solo:\n${resultado.stdout}${resultado.stderr}`
    );
}

salir(0);
