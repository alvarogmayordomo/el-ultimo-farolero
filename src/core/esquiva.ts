//  Esquiva (voltereta). Lógica pura con tiempos en ms (docs/plan.md):
//  dura 0,3 s y los primeros 0,2 s es invulnerable. Después hay un enfriamiento.

export const DURACION_ESQUIVA = 300;
export const INVULNERABLE_ESQUIVA = 200;
export const ENFRIAMIENTO_ESQUIVA = 400;

export interface Direccion2D {
    x: number;
    y: number;
}

export class Esquiva {
    private inicio = -Infinity;
    private direccion: Direccion2D = { x: 0, y: 1 };

    //  Intenta empezar una esquiva en la dirección dada (se normaliza).
    //  Devuelve true si empieza, false si aún está esquivando o enfriándose.
    iniciar(ahora: number, direccion: Direccion2D): boolean {
        if (ahora < this.inicio + DURACION_ESQUIVA + ENFRIAMIENTO_ESQUIVA) {
            return false;
        }

        const largo = Math.hypot(direccion.x, direccion.y);

        if (largo === 0) {
            return false;
        }

        this.inicio = ahora;
        this.direccion = { x: direccion.x / largo, y: direccion.y / largo };

        return true;
    }

    activa(ahora: number): boolean {
        return ahora >= this.inicio && ahora < this.inicio + DURACION_ESQUIVA;
    }

    invulnerable(ahora: number): boolean {
        return ahora >= this.inicio && ahora < this.inicio + INVULNERABLE_ESQUIVA;
    }

    //  Dirección normalizada de la esquiva en curso
    get haciaDonde(): Direccion2D {
        return this.direccion;
    }
}
