import { describe, expect, it } from 'vitest';
import { Luchador } from './luchador';
import { CURACION_POCION, MAX_POCIONES, Pociones } from './pociones';

describe('Pociones', () => {
    it('se recogen hasta el máximo', () => {
        const pociones = new Pociones();

        for (let i = 0; i < MAX_POCIONES; i++) {
            expect(pociones.recoger()).toBe(true);
        }

        expect(pociones.recoger()).toBe(false);
        expect(pociones.cantidad).toBe(MAX_POCIONES);
    });

    it('beber cura y gasta una', () => {
        const pociones = new Pociones(2);
        const farolero = new Luchador({ pv: 100, atq: 10, def: 0 });
        farolero.perderPv(60);

        expect(pociones.beber(farolero)).toBe(CURACION_POCION);
        expect(farolero.pv).toBe(80);
        expect(pociones.cantidad).toBe(1);
    });

    it('no cura por encima del máximo', () => {
        const pociones = new Pociones(1);
        const farolero = new Luchador({ pv: 100, atq: 10, def: 0 });
        farolero.perderPv(10);

        expect(pociones.beber(farolero)).toBe(10);
        expect(farolero.pv).toBe(100);
    });

    it('no se gasta con la vida llena, sin pociones o muerto', () => {
        const farolero = new Luchador({ pv: 100, atq: 10, def: 0 });

        expect(new Pociones(1).beber(farolero)).toBe(0);
        farolero.perderPv(50);
        expect(new Pociones(0).beber(farolero)).toBe(0);
        farolero.perderPv(50);
        const pociones = new Pociones(1);
        expect(pociones.beber(farolero)).toBe(0);
        expect(pociones.cantidad).toBe(1);
    });
});
