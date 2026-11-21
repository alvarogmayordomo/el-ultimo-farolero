import { describe, expect, it } from 'vitest';
import { partidaNueva } from '../core/partida';
import { type Almacen, borrar, cargar, guardar, hayPartida } from './guardado';

function almacenEnMemoria(): Almacen & { datos: Map<string, string> } {
    const datos = new Map<string, string>();

    return {
        datos,
        getItem: (clave) => datos.get(clave) ?? null,
        setItem: (clave, valor) => datos.set(clave, valor),
        removeItem: (clave) => datos.delete(clave)
    };
}

describe('Guardado', () => {
    it('sin guardado no hay partida', () => {
        const almacen = almacenEnMemoria();

        expect(cargar(almacen)).toBeNull();
        expect(hayPartida(almacen)).toBe(false);
    });

    it('guarda y recupera la misma partida', () => {
        const almacen = almacenEnMemoria();
        const partida = partidaNueva('nivel-2');
        partida.experiencia = 120;
        partida.braseros.push('nivel-1:5');

        expect(guardar(partida, almacen)).toBe(true);
        expect(cargar(almacen)).toEqual(partida);
    });

    it('un guardado corrupto se trata como si no hubiera partida', () => {
        const almacen = almacenEnMemoria();
        almacen.setItem('el-ultimo-farolero:partida', '{esto no es json');

        expect(cargar(almacen)).toBeNull();
    });

    it('un guardado de otra versión o con datos raros se ignora', () => {
        const almacen = almacenEnMemoria();
        almacen.setItem('el-ultimo-farolero:partida', JSON.stringify({ version: 99, partida: partidaNueva('x') }));
        expect(cargar(almacen)).toBeNull();

        almacen.setItem('el-ultimo-farolero:partida', JSON.stringify({ version: 1, partida: { nivel: 3 } }));
        expect(cargar(almacen)).toBeNull();
    });

    it('borrar elimina la partida', () => {
        const almacen = almacenEnMemoria();
        guardar(partidaNueva('nivel-1'), almacen);
        borrar(almacen);

        expect(hayPartida(almacen)).toBe(false);
    });

    it('si el almacén falla, no rompe el juego', () => {
        const roto: Almacen = {
            getItem: () => {
                throw new Error('bloqueado');
            },
            setItem: () => {
                throw new Error('lleno');
            },
            removeItem: () => {
                throw new Error('bloqueado');
            }
        };

        expect(guardar(partidaNueva('nivel-1'), roto)).toBe(false);
        expect(cargar(roto)).toBeNull();
        expect(() => borrar(roto)).not.toThrow();
    });
});
