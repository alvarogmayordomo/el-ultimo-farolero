import { describe, expect, it } from 'vitest';
import { DURACION_ESQUIVA, ENFRIAMIENTO_ESQUIVA, Esquiva, INVULNERABLE_ESQUIVA } from './esquiva';

describe('Esquiva', () => {
    it('dura 0,3 s', () => {
        const esquiva = new Esquiva();
        esquiva.iniciar(1000, { x: 1, y: 0 });

        expect(DURACION_ESQUIVA).toBe(300);
        expect(esquiva.activa(1000)).toBe(true);
        expect(esquiva.activa(1299)).toBe(true);
        expect(esquiva.activa(1300)).toBe(false);
    });

    it('es invulnerable solo los primeros 0,2 s', () => {
        const esquiva = new Esquiva();
        esquiva.iniciar(1000, { x: 1, y: 0 });

        expect(INVULNERABLE_ESQUIVA).toBe(200);
        expect(esquiva.invulnerable(1199)).toBe(true);
        expect(esquiva.invulnerable(1200)).toBe(false);
        expect(esquiva.activa(1200)).toBe(true);
    });

    it('no es invulnerable antes de esquivar', () => {
        const esquiva = new Esquiva();

        expect(esquiva.invulnerable(0)).toBe(false);
        expect(esquiva.activa(0)).toBe(false);
    });

    it('normaliza la dirección en diagonal', () => {
        const esquiva = new Esquiva();
        esquiva.iniciar(0, { x: 1, y: 1 });

        expect(Math.hypot(esquiva.haciaDonde.x, esquiva.haciaDonde.y)).toBeCloseTo(1);
    });

    it('no se puede volver a esquivar hasta que pase el enfriamiento', () => {
        const esquiva = new Esquiva();
        esquiva.iniciar(0, { x: 1, y: 0 });
        const libre = DURACION_ESQUIVA + ENFRIAMIENTO_ESQUIVA;

        expect(esquiva.iniciar(libre - 1, { x: 1, y: 0 })).toBe(false);
        expect(esquiva.iniciar(libre, { x: 1, y: 0 })).toBe(true);
    });

    it('sin dirección no esquiva', () => {
        const esquiva = new Esquiva();

        expect(esquiva.iniciar(0, { x: 0, y: 0 })).toBe(false);
    });
});
