import { describe, expect, it } from 'vitest';
import { Combo, DESCANSO, DURACION_GOLPE, VENTANA_ENCADENAR } from './combo';

describe('Combo', () => {
    it('el primer ataque es el golpe 1 con multiplicador 1', () => {
        const combo = new Combo();
        const golpe = combo.atacar(0);

        expect(golpe).toMatchObject({ numero: 1, multiplicador: 1, inicio: 0, fin: DURACION_GOLPE });
    });

    it('encadena los 3 golpes si se ataca dentro de la ventana', () => {
        const combo = new Combo();

        expect(combo.atacar(0)?.numero).toBe(1);
        expect(combo.atacar(DURACION_GOLPE + 50)?.numero).toBe(2);
        expect(combo.atacar(DURACION_GOLPE * 2 + 100)?.numero).toBe(3);
    });

    it('el tercer golpe tiene el multiplicador más alto', () => {
        const combo = new Combo();
        combo.atacar(0);
        combo.atacar(DURACION_GOLPE);
        const tercero = combo.atacar(DURACION_GOLPE * 2);

        expect(tercero?.multiplicador).toBe(1.6);
    });

    it('vuelve al golpe 1 si se deja pasar la ventana', () => {
        const combo = new Combo();
        combo.atacar(0);

        const tarde = combo.atacar(DURACION_GOLPE + VENTANA_ENCADENAR + 1);

        expect(tarde?.numero).toBe(1);
    });

    it('un ataque a mitad de golpe queda apuntado y empieza al acabar el golpe', () => {
        const combo = new Combo();
        combo.atacar(0);

        expect(combo.atacar(100)).toBeNull();
        expect(combo.actualizar(DURACION_GOLPE - 1)).toBeNull();

        const siguiente = combo.actualizar(DURACION_GOLPE + 5);

        expect(siguiente).toMatchObject({ numero: 2, inicio: DURACION_GOLPE });
    });

    it('tras el tercer golpe hay un descanso antes de otro combo', () => {
        const combo = new Combo();
        combo.atacar(0);
        combo.atacar(DURACION_GOLPE);
        const tercero = combo.atacar(DURACION_GOLPE * 2)!;

        expect(combo.atacar(tercero.fin + 10)).toBeNull();
        expect(combo.atacar(tercero.fin + DESCANSO)?.numero).toBe(1);
    });

    it('golpeActivo solo devuelve el golpe mientras dura', () => {
        const combo = new Combo();
        combo.atacar(0);

        expect(combo.golpeActivo(DURACION_GOLPE - 1)?.numero).toBe(1);
        expect(combo.golpeActivo(DURACION_GOLPE)).toBeNull();
    });

    it('cancelar corta el combo y el siguiente ataque vuelve al golpe 1', () => {
        const combo = new Combo();
        combo.atacar(0);
        combo.cancelar();

        expect(combo.golpeActivo(10)).toBeNull();
        expect(combo.atacar(DURACION_GOLPE + 10)?.numero).toBe(1);
    });
});
