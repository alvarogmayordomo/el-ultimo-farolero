import type { Estadisticas } from './luchador';

//  Experiencia y nivel del farolero (como máximo nivel 5, docs/plan.md). Lógica pura.
//
//  Cada enemigo da experiencia al morir. Al llegar a la cifra de la tabla se sube de
//  nivel, y cada nivel mejora las estadísticas base. El equipo suma aparte.

export const NIVEL_MAX = 5;

//  Experiencia total necesaria para llegar a cada nivel (índice 0 = nivel 1)
export const EXPERIENCIA_POR_NIVEL = [0, 40, 100, 190, 310] as const;

//  Estadísticas del farolero en nivel 1 y lo que gana con cada nivel
export const BASE_FAROLERO: Estadisticas = { pv: 100, atq: 10, def: 5 };
export const MEJORA_POR_NIVEL: Estadisticas = { pv: 15, atq: 2, def: 2 };

//  Estadísticas base (sin equipo) para un nivel
export function estadisticasDeNivel(nivel: number): Estadisticas {
    const subidas = Math.min(Math.max(nivel, 1), NIVEL_MAX) - 1;

    return {
        pv: BASE_FAROLERO.pv + MEJORA_POR_NIVEL.pv * subidas,
        atq: BASE_FAROLERO.atq + MEJORA_POR_NIVEL.atq * subidas,
        def: BASE_FAROLERO.def + MEJORA_POR_NIVEL.def * subidas
    };
}

export class Experiencia {
    private _total: number;
    private _nivel = 1;

    constructor(total = 0) {
        this._total = 0;
        this.ganar(total);
    }

    get total(): number {
        return this._total;
    }

    get nivel(): number {
        return this._nivel;
    }

    //  Experiencia total que hace falta para el siguiente nivel, o null en el máximo
    get siguienteNivel(): number | null {
        return this._nivel >= NIVEL_MAX ? null : EXPERIENCIA_POR_NIVEL[this._nivel];
    }

    //  Suma experiencia. Devuelve cuántos niveles se han subido (0 casi siempre).
    ganar(cantidad: number): number {
        this._total += Math.max(0, cantidad);
        const antes = this._nivel;

        while (this._nivel < NIVEL_MAX && this._total >= EXPERIENCIA_POR_NIVEL[this._nivel]) {
            this._nivel++;
        }

        return this._nivel - antes;
    }
}
