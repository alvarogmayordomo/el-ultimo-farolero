import { describe, expect, it } from 'vitest';
import { ComportamientoArquero, type ConfigDistancia, MARGEN_HUIDA } from './arquero';

const CONFIG: ConfigDistancia = {
    deteccion: 130,
    olvido: 180,
    alcance: 110,
    huida: 48,
    preparar: 700,
    recargar: 1100,
    herida: 250
};

describe('ComportamientoArquero', () => {
    it('empieza quieto y se acerca al ver al jugador', () => {
        const arquero = new ComportamientoArquero(CONFIG);

        expect(arquero.actualizar(0, 200)).toBe(false);
        expect(arquero.actualizar(10, 130)).toBe(true);
        expect(arquero.estado).toBe('acercarse');
    });

    it('apunta cuando el jugador está a tiro y dispara al terminar de apuntar', () => {
        const arquero = new ComportamientoArquero(CONFIG);
        arquero.actualizar(0, 120);
        arquero.actualizar(10, 100);
        expect(arquero.estado).toBe('apuntar');
        expect(arquero.tomarDisparo()).toBe(false);

        arquero.actualizar(10 + CONFIG.preparar, 100);
        expect(arquero.estado).toBe('recargar');
        expect(arquero.tomarDisparo()).toBe(true);
        expect(arquero.tomarDisparo()).toBe(false);
    });

    it('tras recargar vuelve a buscar posición', () => {
        const arquero = new ComportamientoArquero(CONFIG);
        arquero.actualizar(0, 120);
        arquero.actualizar(10, 100);
        arquero.actualizar(710, 100);
        arquero.actualizar(710 + CONFIG.recargar, 100);

        expect(arquero.estado).toBe('acercarse');
    });

    it('se aleja si el jugador se le echa encima, y apunta al estar a salvo', () => {
        const arquero = new ComportamientoArquero(CONFIG);
        arquero.actualizar(0, 120);
        arquero.actualizar(10, 30);
        expect(arquero.estado).toBe('alejarse');

        arquero.actualizar(20, CONFIG.huida + MARGEN_HUIDA - 1);
        expect(arquero.estado).toBe('alejarse');
        arquero.actualizar(30, CONFIG.huida + MARGEN_HUIDA);
        expect(arquero.estado).toBe('apuntar');
    });

    it('un golpe lo deja herido y cancela el disparo', () => {
        const arquero = new ComportamientoArquero(CONFIG);
        arquero.actualizar(0, 120);
        arquero.actualizar(10, 100);
        arquero.actualizar(710, 100);
        arquero.recibirGolpe(720);

        expect(arquero.estado).toBe('herida');
        expect(arquero.tomarDisparo()).toBe(false);
        arquero.actualizar(720 + CONFIG.herida, 100);
        expect(arquero.estado).toBe('acercarse');
    });

    it('olvida al jugador si se aleja mucho', () => {
        const arquero = new ComportamientoArquero(CONFIG);
        arquero.actualizar(0, 120);
        arquero.actualizar(10, CONFIG.olvido + 1);

        expect(arquero.estado).toBe('quieta');
    });

    it('no hace daño por contacto', () => {
        expect(new ComportamientoArquero(CONFIG).haceDano).toBe(false);
    });
});
