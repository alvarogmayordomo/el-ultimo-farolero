import { describe, expect, it } from 'vitest';
import { ALCANCE_ENCENDER, ALCANCE_RECARGA, Brasero } from './brasero';
import { Luz } from './luz';

describe('Brasero', () => {
    it('empieza apagado y no recarga', () => {
        const brasero = new Brasero();

        expect(brasero.encendido).toBe(false);
        expect(brasero.recargaA(0)).toBe(false);
    });

    it('se enciende si el farolero está al lado, y llena la Luz', () => {
        const brasero = new Brasero();
        const luz = new Luz(10);

        expect(brasero.encender(ALCANCE_ENCENDER, luz)).toBe(true);
        expect(brasero.encendido).toBe(true);
        expect(luz.valor).toBe(100);
    });

    it('no se enciende desde lejos', () => {
        const brasero = new Brasero();
        const luz = new Luz(10);

        expect(brasero.encender(ALCANCE_ENCENDER + 1, luz)).toBe(false);
        expect(brasero.encendido).toBe(false);
        expect(luz.valor).toBe(10);
    });

    it('encendido no se vuelve a encender', () => {
        const brasero = new Brasero();
        const luz = new Luz(10);
        brasero.encender(0, luz);
        luz.gastar(50);

        expect(brasero.encender(0, luz)).toBe(false);
        expect(luz.valor).toBe(50);
    });

    it('encendido recarga solo a quien está cerca', () => {
        const brasero = new Brasero();
        brasero.encender(0, new Luz());

        expect(brasero.recargaA(ALCANCE_RECARGA)).toBe(true);
        expect(brasero.recargaA(ALCANCE_RECARGA + 1)).toBe(false);
    });

    it('apagado deja de recargar y se puede volver a encender', () => {
        const brasero = new Brasero();
        const luz = new Luz(10);
        brasero.encender(0, luz);

        expect(brasero.apagar()).toBe(true);
        expect(brasero.apagar()).toBe(false);
        expect(brasero.recargaA(0)).toBe(false);
        luz.gastar(50);
        expect(brasero.encender(0, luz)).toBe(true);
        expect(luz.valor).toBe(100);
    });

    it('restaurado desde una partida guardada está encendido sin tocar la Luz', () => {
        const brasero = new Brasero();
        brasero.restaurarEncendido();

        expect(brasero.encendido).toBe(true);
    });
});
