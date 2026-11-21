import { describe, expect, it } from 'vitest';
import { Luchador } from './luchador';

describe('Luchador', () => {
    it('recibe el daño de la fórmula y pierde esos PV', () => {
        const jugador = new Luchador({ pv: 100, atq: 10, def: 5 });
        const sombra = new Luchador({ pv: 30, atq: 8, def: 0 });

        //  10 × 1.6 × 100 / (100 + 0) = 16
        expect(sombra.recibirGolpe(jugador, 1.6, 0)).toBe(16);
        expect(sombra.pv).toBe(14);
    });

    it('los PV no bajan de 0 y a 0 ya no está vivo', () => {
        const fuerte = new Luchador({ pv: 100, atq: 100, def: 0 });
        const debil = new Luchador({ pv: 50, atq: 1, def: 0 });

        debil.recibirGolpe(fuerte, 1, 0);

        expect(debil.pv).toBe(0);
        expect(debil.vivo).toBe(false);
        expect(debil.recibirGolpe(fuerte, 1, 1000)).toBe(0);
    });

    it('tras un golpe es invulnerable durante el tiempo indicado', () => {
        const jugador = new Luchador({ pv: 100, atq: 10, def: 0 }, 600);
        const sombra = new Luchador({ pv: 30, atq: 8, def: 0 });

        expect(jugador.recibirGolpe(sombra, 1, 0)).toBe(8);
        expect(jugador.recibirGolpe(sombra, 1, 599)).toBe(0);
        expect(jugador.recibirGolpe(sombra, 1, 600)).toBe(8);
        expect(jugador.pv).toBe(84);
    });

    it('pierde PV por el frío aunque sea invulnerable, sin bajar de 0', () => {
        const jugador = new Luchador({ pv: 50, atq: 10, def: 0 }, 600);
        const sombra = new Luchador({ pv: 30, atq: 8, def: 0 });
        jugador.recibirGolpe(sombra, 1, 0);

        jugador.perderPv(3);
        expect(jugador.pv).toBe(39);
        jugador.perderPv(100);
        expect(jugador.pv).toBe(0);
        expect(jugador.vivo).toBe(false);
    });

    it('curar no pasa del máximo y devuelve lo curado', () => {
        const jugador = new Luchador({ pv: 100, atq: 10, def: 0 });
        jugador.perderPv(30);

        expect(jugador.curar(20)).toBe(20);
        expect(jugador.curar(50)).toBe(10);
        expect(jugador.pv).toBe(100);
    });

    it('al subir el máximo de PV la vida actual sube lo mismo', () => {
        const jugador = new Luchador({ pv: 100, atq: 10, def: 5 });
        jugador.perderPv(40);
        jugador.aplicarEstadisticas({ pv: 115, atq: 12, def: 7 });

        expect(jugador.pvMax).toBe(115);
        expect(jugador.pv).toBe(75);
        expect(jugador.atq).toBe(12);
        expect(jugador.def).toBe(7);
    });

    it('al bajar el máximo de PV la vida se recorta, pero no mata', () => {
        const jugador = new Luchador({ pv: 100, atq: 10, def: 5 });
        jugador.aplicarEstadisticas({ pv: 80, atq: 10, def: 5 });

        expect(jugador.pv).toBe(80);
    });
});
