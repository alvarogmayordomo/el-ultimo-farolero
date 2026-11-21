import type { Luchador } from './luchador';

//  Pociones de vida: se recogen del suelo (hasta un máximo) y se beben con una tecla.
//  Lógica pura.

export const MAX_POCIONES = 3;
export const CURACION_POCION = 40;

export class Pociones {
    private _cantidad: number;

    constructor(cantidad = 0) {
        this._cantidad = Math.min(Math.max(cantidad, 0), MAX_POCIONES);
    }

    get cantidad(): number {
        return this._cantidad;
    }

    //  Devuelve true si cabe y se ha guardado
    recoger(): boolean {
        if (this._cantidad >= MAX_POCIONES) {
            return false;
        }

        this._cantidad++;

        return true;
    }

    //  Bebe una si hay y si sirve de algo (no con la vida llena ni muerto).
    //  Devuelve los PV curados (0 si no se ha bebido).
    beber(luchador: Luchador): number {
        if (this._cantidad === 0 || !luchador.vivo || luchador.pv >= luchador.pvMax) {
            return 0;
        }

        this._cantidad--;

        return luchador.curar(CURACION_POCION);
    }
}
