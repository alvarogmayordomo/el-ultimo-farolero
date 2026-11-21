import { describe, expect, it } from 'vitest';
import { DESGASTE_POR_SEGUNDO, LUZ_MAX, Luz, RECARGA_POR_SEGUNDO, radioDeLuz } from './luz';

describe('radioDeLuz', () => {
    it('va de 48 px con Luz 0 a 160 px con Luz 100', () => {
        expect(radioDeLuz(0)).toBe(48);
        expect(radioDeLuz(100)).toBe(160);
        expect(radioDeLuz(50)).toBe(104);
    });

    it('no sale de esos límites', () => {
        expect(radioDeLuz(-10)).toBe(48);
        expect(radioDeLuz(150)).toBe(160);
    });
});

describe('Luz', () => {
    it('empieza llena y entre 0 y 100', () => {
        expect(new Luz().valor).toBe(LUZ_MAX);
        expect(new Luz(250).valor).toBe(100);
        expect(new Luz(-5).valor).toBe(0);
    });

    it('solo gasta si hay suficiente', () => {
        const luz = new Luz(20);

        expect(luz.gastar(15)).toBe(true);
        expect(luz.valor).toBe(5);
        expect(luz.gastar(15)).toBe(false);
        expect(luz.valor).toBe(5);
    });

    it('no pasa de 100 al ganar', () => {
        const luz = new Luz(99);
        luz.ganar(2);

        expect(luz.valor).toBe(100);
    });

    it('se desgasta con el tiempo lejos de los braseros', () => {
        const luz = new Luz(50);
        luz.actualizar(10_000, false);

        expect(luz.valor).toBeCloseTo(50 - 10 * DESGASTE_POR_SEGUNDO);
    });

    it('se recarga junto a un brasero encendido', () => {
        const luz = new Luz(10);
        luz.actualizar(1000, true);

        expect(luz.valor).toBeCloseTo(10 + RECARGA_POR_SEGUNDO);
    });

    it('no hace daño por frío mientras quede Luz', () => {
        const luz = new Luz(50);

        expect(luz.actualizar(5000, false)).toBe(0);
    });

    it('con la Luz a 0 el frío quita 3 PV por segundo', () => {
        const luz = new Luz(0);
        let frio = 0;

        //  60 fotogramas de ~16,7 ms = 1 segundo
        for (let i = 0; i < 60; i++) {
            frio += luz.actualizar(1000 / 60, false);
        }

        expect(frio).toBe(3);
    });

    it('el frío para junto a un brasero', () => {
        const luz = new Luz(0);

        expect(luz.actualizar(2000, true)).toBe(0);
        expect(luz.valor).toBeGreaterThan(0);
    });
});
