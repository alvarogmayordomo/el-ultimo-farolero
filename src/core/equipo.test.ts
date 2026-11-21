import { describe, expect, it } from 'vitest';
import { Equipo, type Objeto } from './equipo';

const KATANA: Objeto = { id: 'katana', nombre: 'Katana', ranura: 'arma', atq: 4, def: 0 };
const GRAN_ESPADA: Objeto = { id: 'gran-espada', nombre: 'Gran espada', ranura: 'arma', atq: 9, def: 0 };
const AMULETO: Objeto = { id: 'amuleto', nombre: 'Amuleto', ranura: 'talisman', atq: 0, def: 8 };

describe('Equipo', () => {
    it('empieza vacío y no suma nada', () => {
        const equipo = new Equipo();

        expect(equipo.atq).toBe(0);
        expect(equipo.def).toBe(0);
        expect(equipo.ids).toEqual([]);
    });

    it('equipa solo el primer objeto de cada ranura', () => {
        const equipo = new Equipo();

        expect(equipo.recoger(KATANA)).toBe(true);
        expect(equipo.recoger(AMULETO)).toBe(true);
        expect(equipo.atq).toBe(4);
        expect(equipo.def).toBe(8);
        expect(equipo.ids).toEqual(['katana', 'amuleto']);
    });

    it('cambia el arma si la nueva es mejor', () => {
        const equipo = new Equipo();
        equipo.recoger(KATANA);

        expect(equipo.recoger(GRAN_ESPADA)).toBe(true);
        expect(equipo.arma?.id).toBe('gran-espada');
    });

    it('no cambia a un objeto peor ni igual', () => {
        const equipo = new Equipo();
        equipo.recoger(GRAN_ESPADA);

        expect(equipo.recoger(KATANA)).toBe(false);
        expect(equipo.recoger(GRAN_ESPADA)).toBe(false);
        expect(equipo.arma?.id).toBe('gran-espada');
    });
});
