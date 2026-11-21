import { describe, expect, it } from 'vitest';
import manifiesto from '../../assets.manifest.json';
import { ENEMIGOS, NIVELES, OBJETOS, objetoPorId } from './datos';
import { esquemaEnemigo } from './esquemas';

//  Lista de archivos de public/assets. import.meta.glob es de Vite: así no hace falta
//  leer el disco con Node. Las claves son rutas como «/public/assets/fx/tajo.png».
const ARCHIVOS = new Set(
    Object.keys(import.meta.glob('/public/assets/**/*', { eager: false })).map((ruta) => ruta.slice(1))
);

function existe(ruta: string): boolean {
    return ARCHIVOS.has(ruta);
}

describe('Datos del juego', () => {
    it('los JSON cumplen sus esquemas (se validan al importar)', () => {
        expect(Object.keys(ENEMIGOS)).toEqual(expect.arrayContaining(['sombra', 'arquero', 'bruto']));
        expect(Object.keys(OBJETOS)).toHaveLength(3);
        expect(NIVELES.filter((n) => n.jefe)).toHaveLength(1);
    });

    it('cada enemigo, objeto y nivel tiene su archivo en public/assets', () => {
        for (const enemigo of Object.values(ENEMIGOS)) {
            expect(existe(`public/assets/enemigos/${enemigo.sprite}.png`), enemigo.sprite).toBe(true);
        }
        for (const objeto of Object.values(OBJETOS)) {
            expect(existe(`public/assets/objetos/${objeto.sprite}.png`), objeto.sprite).toBe(true);
        }
        for (const nivel of NIVELES) {
            expect(existe(`public/assets/mapas/${nivel.mapa}.tmj`), nivel.mapa).toBe(true);
        }
    });

    it('el esquema rechaza un enemigo mal escrito y dice por qué', () => {
        const malo = { ...ENEMIGOS.sombra, estadisticas: { pv: -5, atq: 1, def: 0 } };
        const resultado = esquemaEnemigo.safeParse(malo);

        expect(resultado.success).toBe(false);
        expect(resultado.error?.issues[0].path).toEqual(['estadisticas', 'pv']);
    });

    it('el esquema exige que olvidar quede más lejos que detectar', () => {
        const malo = { ...ENEMIGOS.sombra, distancias: { deteccion: 100, olvido: 50, alcance: 20 } };

        expect(esquemaEnemigo.safeParse(malo).success).toBe(false);
    });

    it('objetoPorId devuelve el objeto listo para equipar, o null', () => {
        expect(objetoPorId('katana')).toEqual({ id: 'katana', nombre: 'Katana', ranura: 'arma', atq: 4, def: 0 });
        expect(objetoPorId('no-existe')).toBeNull();
    });
});

//  El plan exige que cada recurso tenga su licencia registrada: estos tests fallan si
//  aparece en public/assets una imagen, sonido o fuente que no está en assets.manifest.json,
//  o si su fuente no es CC0 o CC-BY. Así `npm test` (y la publicación) no pasan sin licencia.
describe('Licencias de los recursos', () => {
    const fuentes: Record<string, { licencia: string }> = manifiesto.fuentes;
    const registrados = new Set(manifiesto.recursos.map((r) => r.archivo));

    it('cada imagen, sonido y fuente de public/assets está en assets.manifest.json', () => {
        const sinRegistrar = [...ARCHIVOS]
            .filter((ruta) => /\.(png|ogg|wav|mp3|ttf)$/i.test(ruta))
            .filter((ruta) => !registrados.has(ruta));

        expect(sinRegistrar).toEqual([]);
    });

    it('cada recurso registrado existe y su fuente tiene licencia CC0 o CC-BY', () => {
        for (const recurso of manifiesto.recursos) {
            expect(existe(recurso.archivo), recurso.archivo).toBe(true);
            expect(fuentes[recurso.fuente]?.licencia, recurso.archivo).toMatch(/^CC0|^CC-BY/);
        }
    });
});
