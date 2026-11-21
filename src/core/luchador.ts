import { calcularDano } from './dano';

//  Puntos de vida y estadísticas de combate de cualquier personaje (jugador o enemigo)

export interface Estadisticas {
    pv: number;
    atq: number;
    def: number;
}

export class Luchador {
    pvMax: number;
    pv: number;
    atq: number;
    def: number;

    //  Tras recibir un golpe, el luchador no puede volver a recibir daño hasta este instante
    private invulnerableHasta = -Infinity;

    constructor(
        estadisticas: Estadisticas,
        private readonly invulnerabilidadTrasGolpe = 0
    ) {
        this.pvMax = estadisticas.pv;
        this.pv = estadisticas.pv;
        this.atq = estadisticas.atq;
        this.def = estadisticas.def;
    }

    get vivo(): boolean {
        return this.pv > 0;
    }

    invulnerable(ahora: number): boolean {
        return ahora < this.invulnerableHasta;
    }

    //  Recupera PV sin pasar del máximo. Devuelve cuántos ha recuperado de verdad.
    curar(cantidad: number): number {
        const antes = this.pv;
        this.pv = Math.min(this.pvMax, this.pv + Math.max(0, cantidad));

        return this.pv - antes;
    }

    //  Cambia las estadísticas (al subir de nivel o cambiar de equipo). Si sube el
    //  máximo de PV, la vida actual sube lo mismo; si baja, se recorta al nuevo máximo.
    aplicarEstadisticas(estadisticas: Estadisticas) {
        const subida = estadisticas.pv - this.pvMax;
        this.pvMax = estadisticas.pv;
        this.pv = Math.min(this.pvMax, Math.max(this.vivo ? 1 : 0, this.pv + Math.max(0, subida)));
        this.atq = estadisticas.atq;
        this.def = estadisticas.def;
    }

    //  Pierde PV sin golpe ni fórmula de daño (por ejemplo, el frío sin Luz).
    //  No respeta la invulnerabilidad: el frío no se esquiva.
    perderPv(cantidad: number) {
        this.pv = Math.max(0, this.pv - cantidad);
    }

    //  Recibe un golpe de `atacante` con el multiplicador dado.
    //  Devuelve el daño aplicado (0 si estaba muerto o era invulnerable).
    recibirGolpe(atacante: Luchador, multiplicador: number, ahora: number): number {
        if (!this.vivo || this.invulnerable(ahora)) {
            return 0;
        }

        const dano = calcularDano(atacante.atq, multiplicador, this.def);
        this.pv = Math.max(0, this.pv - dano);
        this.invulnerableHasta = ahora + this.invulnerabilidadTrasGolpe;

        return dano;
    }
}
