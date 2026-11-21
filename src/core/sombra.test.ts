import { describe, expect, it } from 'vitest';
import {
    CONFIG_SOMBRA,
    ComportamientoSombra,
    DISTANCIA_ALCANCE,
    DISTANCIA_DETECCION,
    DISTANCIA_OLVIDO,
    TIEMPO_ATACAR,
    TIEMPO_HERIDA,
    TIEMPO_PREPARAR,
    TIEMPO_RECUPERAR
} from './sombra';

describe('ComportamientoSombra', () => {
    it('empieza quieta y no se mueve si el jugador está lejos', () => {
        const sombra = new ComportamientoSombra();

        expect(sombra.actualizar(0, DISTANCIA_DETECCION + 1)).toBe(false);
        expect(sombra.estado).toBe('quieta');
    });

    it('persigue al jugador cuando se acerca', () => {
        const sombra = new ComportamientoSombra();

        expect(sombra.actualizar(0, DISTANCIA_DETECCION)).toBe(true);
        expect(sombra.estado).toBe('perseguir');
    });

    it('deja de perseguir si el jugador se aleja demasiado', () => {
        const sombra = new ComportamientoSombra();
        sombra.actualizar(0, 50);
        sombra.actualizar(100, DISTANCIA_OLVIDO + 1);

        expect(sombra.estado).toBe('quieta');
    });

    it('avisa antes de atacar: preparar → atacar → recuperar → perseguir', () => {
        const sombra = new ComportamientoSombra();
        sombra.actualizar(0, 50);
        sombra.actualizar(100, DISTANCIA_ALCANCE);
        expect(sombra.estado).toBe('preparar');
        expect(sombra.haceDano).toBe(false);

        sombra.actualizar(100 + TIEMPO_PREPARAR - 1, 0);
        expect(sombra.estado).toBe('preparar');

        sombra.actualizar(100 + TIEMPO_PREPARAR, 0);
        expect(sombra.estado).toBe('atacar');
        expect(sombra.haceDano).toBe(true);

        const finAtaque = 100 + TIEMPO_PREPARAR + TIEMPO_ATACAR;
        sombra.actualizar(finAtaque, 0);
        expect(sombra.estado).toBe('recuperar');
        expect(sombra.haceDano).toBe(false);

        sombra.actualizar(finAtaque + TIEMPO_RECUPERAR, 0);
        expect(sombra.estado).toBe('perseguir');
    });

    it('un golpe la deja herida, cancela su ataque y luego vuelve a perseguir', () => {
        const sombra = new ComportamientoSombra();
        sombra.actualizar(0, 50);
        sombra.actualizar(10, DISTANCIA_ALCANCE);
        sombra.actualizar(10 + TIEMPO_PREPARAR, 0);
        expect(sombra.estado).toBe('atacar');

        sombra.recibirGolpe(500);
        expect(sombra.estado).toBe('herida');
        expect(sombra.haceDano).toBe(false);

        sombra.actualizar(500 + TIEMPO_HERIDA, 0);
        expect(sombra.estado).toBe('perseguir');
    });
});

describe('Comportamiento cuerpo a cuerpo no aturdible (el Bruto)', () => {
    const CONFIG_BRUTO = { ...CONFIG_SOMBRA, aturdible: false };

    it('un golpe no le corta el ataque', () => {
        const bruto = new ComportamientoSombra(CONFIG_BRUTO);
        bruto.actualizar(0, 50);
        bruto.actualizar(10, DISTANCIA_ALCANCE);

        expect(bruto.recibirGolpe(20)).toBe(false);
        expect(bruto.estado).toBe('preparar');
    });

    it('un golpe lo despierta si estaba quieto', () => {
        const bruto = new ComportamientoSombra(CONFIG_BRUTO);

        bruto.recibirGolpe(0);
        expect(bruto.estado).toBe('perseguir');
    });

    it('usa sus propios números', () => {
        const bruto = new ComportamientoSombra({ ...CONFIG_BRUTO, alcance: 30 });
        bruto.actualizar(0, 50);
        bruto.actualizar(10, 30);

        expect(bruto.estado).toBe('preparar');
    });
});
