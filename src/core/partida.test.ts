import { describe, expect, it } from 'vitest';
import { cambiarDeNivel, clave, copiarPartida, formatearTiempo, partidaNueva, trasMorir } from './partida';

describe('Partida', () => {
    it('una partida nueva empieza en el primer nivel, sin nada', () => {
        const partida = partidaNueva('nivel-1');

        expect(partida.nivel).toBe('nivel-1');
        expect(partida.brasero).toBeNull();
        expect(partida.experiencia).toBe(0);
        expect(partida.estadisticas).toEqual({ muertes: 0, enemigosVencidos: 0, tiempo: 0 });
    });

    it('las claves juntan nivel e id de Tiled', () => {
        expect(clave('nivel-2', 14)).toBe('nivel-2:14');
    });

    it('una copia no cambia al cambiar la original', () => {
        const partida = partidaNueva('nivel-1');
        const copia = copiarPartida(partida);
        partida.braseros.push('nivel-1:3');

        expect(copia.braseros).toEqual([]);
    });

    it('al cambiar de nivel se olvida el brasero', () => {
        const partida = partidaNueva('nivel-1');
        partida.brasero = 'nivel-1:3';
        cambiarDeNivel(partida, 'nivel-2');

        expect(partida.nivel).toBe('nivel-2');
        expect(partida.brasero).toBeNull();
    });

    it('al morir se vuelve a lo guardado pero se cuentan la muerte y el tiempo', () => {
        const guardada = partidaNueva('nivel-1');
        guardada.experiencia = 50;
        guardada.estadisticas.tiempo = 1000;

        const enCurso = copiarPartida(guardada);
        enCurso.experiencia = 90;
        enCurso.estadisticas = { muertes: 2, enemigosVencidos: 7, tiempo: 5000 };

        const resultado = trasMorir(guardada, enCurso);

        expect(resultado.experiencia).toBe(50);
        expect(resultado.estadisticas).toEqual({ muertes: 3, enemigosVencidos: 7, tiempo: 5000 });
    });

    it('formatea el tiempo jugado', () => {
        expect(formatearTiempo(0)).toBe('0:00');
        expect(formatearTiempo(754_000)).toBe('12:34');
        expect(formatearTiempo(3_909_000)).toBe('1:05:09');
    });
});
