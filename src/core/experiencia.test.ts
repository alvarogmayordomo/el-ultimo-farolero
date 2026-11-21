import { describe, expect, it } from 'vitest';
import { EXPERIENCIA_POR_NIVEL, Experiencia, estadisticasDeNivel, NIVEL_MAX } from './experiencia';

describe('Experiencia', () => {
    it('empieza en nivel 1 sin experiencia', () => {
        const xp = new Experiencia();

        expect(xp.nivel).toBe(1);
        expect(xp.total).toBe(0);
        expect(xp.siguienteNivel).toBe(EXPERIENCIA_POR_NIVEL[1]);
    });

    it('sube de nivel al llegar a la cifra de la tabla', () => {
        const xp = new Experiencia();

        expect(xp.ganar(EXPERIENCIA_POR_NIVEL[1] - 1)).toBe(0);
        expect(xp.ganar(1)).toBe(1);
        expect(xp.nivel).toBe(2);
    });

    it('puede subir varios niveles de golpe', () => {
        const xp = new Experiencia();

        expect(xp.ganar(EXPERIENCIA_POR_NIVEL[3])).toBe(3);
        expect(xp.nivel).toBe(4);
    });

    it('no pasa del nivel 5', () => {
        const xp = new Experiencia();
        xp.ganar(100_000);

        expect(xp.nivel).toBe(NIVEL_MAX);
        expect(xp.siguienteNivel).toBeNull();
        expect(xp.ganar(500)).toBe(0);
    });

    it('se puede reconstruir desde la experiencia guardada', () => {
        expect(new Experiencia(EXPERIENCIA_POR_NIVEL[2] + 5).nivel).toBe(3);
    });

    it('ignora cantidades negativas', () => {
        const xp = new Experiencia(50);
        xp.ganar(-30);

        expect(xp.total).toBe(50);
    });
});

describe('estadisticasDeNivel', () => {
    it('nivel 1 son las de base y cada nivel suma lo mismo', () => {
        expect(estadisticasDeNivel(1)).toEqual({ pv: 100, atq: 10, def: 5 });
        expect(estadisticasDeNivel(2)).toEqual({ pv: 115, atq: 12, def: 7 });
        expect(estadisticasDeNivel(5)).toEqual({ pv: 160, atq: 18, def: 13 });
    });

    it('no sale de los niveles 1 a 5', () => {
        expect(estadisticasDeNivel(9)).toEqual(estadisticasDeNivel(5));
        expect(estadisticasDeNivel(0)).toEqual(estadisticasDeNivel(1));
    });
});
