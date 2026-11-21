import type { Luz } from './luz';

//  Lanza de Luz: un proyectil que gasta Luz. Lógica pura con tiempos en ms.
//  El plan no fija sus números; estos son los del MVP (docs/decisiones/0002-luz.md).

export const COSTE_LANZA = 15;
export const MULTIPLICADOR_LANZA = 2;
export const ENFRIAMIENTO_LANZA = 500;

//  Movimiento del proyectil, en píxeles por segundo y píxeles
export const VELOCIDAD_LANZA = 220;
export const ALCANCE_LANZA = 160;

export class LanzaDeLuz {
    private listaDesde = -Infinity;

    //  Intenta lanzar: hace falta haber pasado el enfriamiento y tener Luz.
    //  Si se lanza, gasta la Luz y devuelve true.
    lanzar(ahora: number, luz: Luz): boolean {
        if (ahora < this.listaDesde || !luz.gastar(COSTE_LANZA)) {
            return false;
        }

        this.listaDesde = ahora + ENFRIAMIENTO_LANZA;

        return true;
    }
}
