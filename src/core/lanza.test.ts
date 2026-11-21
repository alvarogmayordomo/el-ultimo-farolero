import { describe, expect, it } from 'vitest';
import { COSTE_LANZA, ENFRIAMIENTO_LANZA, LanzaDeLuz } from './lanza';
import { Luz } from './luz';

describe('LanzaDeLuz', () => {
    it('gasta Luz al lanzarse', () => {
        const lanza = new LanzaDeLuz();
        const luz = new Luz(50);

        expect(lanza.lanzar(1000, luz)).toBe(true);
        expect(luz.valor).toBe(50 - COSTE_LANZA);
    });

    it('no se lanza sin Luz suficiente, y entonces no gasta nada', () => {
        const lanza = new LanzaDeLuz();
        const luz = new Luz(COSTE_LANZA - 1);

        expect(lanza.lanzar(1000, luz)).toBe(false);
        expect(luz.valor).toBe(COSTE_LANZA - 1);
    });

    it('tiene un enfriamiento entre lanzamientos', () => {
        const lanza = new LanzaDeLuz();
        const luz = new Luz(100);

        lanza.lanzar(1000, luz);

        expect(lanza.lanzar(1000 + ENFRIAMIENTO_LANZA - 1, luz)).toBe(false);
        expect(luz.valor).toBe(100 - COSTE_LANZA);
        expect(lanza.lanzar(1000 + ENFRIAMIENTO_LANZA, luz)).toBe(true);
    });

    it('un intento fallido por falta de Luz no activa el enfriamiento', () => {
        const lanza = new LanzaDeLuz();
        const luz = new Luz(0);

        expect(lanza.lanzar(1000, luz)).toBe(false);
        luz.llenar();
        expect(lanza.lanzar(1001, luz)).toBe(true);
    });
});
