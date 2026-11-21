//  La Guardiana del Pozo, jefe de la zona 1 (docs/plan.md). Máquina de estados pura.
//
//  Fase 1 (más de la mitad de PV):
//    dormida ──(jugador cerca)──▶ acechar ──▶ prepararZarpazo ──▶ zarpazo ──▶ recuperar ──▶ acechar
//                                    │          (si está cerca: zarpazo en arco)
//                                    └───────▶ prepararSalto ──▶ salto ──▶ recuperar
//                                               (si está lejos: marca en el suelo dónde caerá)
//  Fase 2 (la mitad de PV o menos):
//    Al entrar, y cada cierto tiempo, pasa por «apagando» y apaga los braseros de la sala.
//    Si el farolero enciende un brasero, la Guardiana queda «aturdida» un rato.
//    Además ataca más deprisa.
//
//  La escena le pasa cada fotograma la distancia al jugador y la proporción de PV que le
//  queda, y recoge los eventos que devuelve (apagar los braseros, el golpe del zarpazo,
//  la caída del salto) para convertirlos en daño y efectos.

export type EstadoGuardiana =
    | 'dormida'
    | 'acechar'
    | 'prepararZarpazo'
    | 'zarpazo'
    | 'prepararSalto'
    | 'salto'
    | 'recuperar'
    | 'apagando'
    | 'aturdida';

export type EventoGuardiana = 'apagarBraseros' | 'golpeZarpazo' | 'aterrizaje';

//  Distancias en px y tiempos en ms
export const DETECCION_GUARDIANA = 120;
export const ALCANCE_ZARPAZO = 40;
export const RADIO_ATERRIZAJE = 30;

export const TIEMPOS_GUARDIANA = {
    acechar: 900,
    prepararZarpazo: 600,
    zarpazo: 200,
    prepararSalto: 900,
    salto: 450,
    recuperar: 800,
    apagando: 1200,
    aturdida: 2600
} as const;

//  En la fase 2 los avisos y los descansos duran menos
export const RAPIDEZ_FASE_2 = 0.7;

//  Cada cuánto vuelve a apagar los braseros en la fase 2
export const INTERVALO_APAGAR = 14_000;

//  Multiplicadores de daño de cada ataque (ATQ × multiplicador × 100 / (100 + DEF))
export const MULTIPLICADOR_ZARPAZO = 1.2;
export const MULTIPLICADOR_SALTO = 1.6;

export class ComportamientoGuardiana {
    private _estado: EstadoGuardiana = 'dormida';
    private _fase: 1 | 2 = 1;
    private desde = 0;
    private ultimoApagado = -Infinity;

    get estado(): EstadoGuardiana {
        return this._estado;
    }

    get fase(): 1 | 2 {
        return this._fase;
    }

    //  ¿Puede recibir daño? En el aire no.
    get vulnerable(): boolean {
        return this._estado !== 'salto' && this._estado !== 'dormida';
    }

    //  Avanza un fotograma. Devuelve el evento de este fotograma, si lo hay.
    actualizar(ahora: number, distanciaAlJugador: number, proporcionPv: number): EventoGuardiana | null {
        const transcurrido = ahora - this.desde;
        const duracion = (estado: keyof typeof TIEMPOS_GUARDIANA) =>
            TIEMPOS_GUARDIANA[estado] * (this._fase === 2 && estado !== 'aturdida' ? RAPIDEZ_FASE_2 : 1);

        //  El paso a la fase 2 interrumpe lo que esté haciendo (salvo en el aire)
        if (this._fase === 1 && proporcionPv <= 0.5 && this._estado !== 'salto' && this._estado !== 'dormida') {
            this._fase = 2;
            this.pasarA('apagando', ahora);
            return null;
        }

        switch (this._estado) {
            case 'dormida':
                if (distanciaAlJugador <= DETECCION_GUARDIANA) {
                    this.pasarA('acechar', ahora);
                }
                return null;

            case 'acechar':
                if (this._fase === 2 && ahora - this.ultimoApagado >= INTERVALO_APAGAR) {
                    this.pasarA('apagando', ahora);
                } else if (transcurrido >= duracion('acechar')) {
                    this.pasarA(distanciaAlJugador <= ALCANCE_ZARPAZO ? 'prepararZarpazo' : 'prepararSalto', ahora);
                }
                return null;

            case 'prepararZarpazo':
                if (transcurrido >= duracion('prepararZarpazo')) {
                    this.pasarA('zarpazo', ahora);
                    return 'golpeZarpazo';
                }
                return null;

            case 'zarpazo':
                if (transcurrido >= duracion('zarpazo')) {
                    this.pasarA('recuperar', ahora);
                }
                return null;

            case 'prepararSalto':
                if (transcurrido >= duracion('prepararSalto')) {
                    this.pasarA('salto', ahora);
                }
                return null;

            case 'salto':
                if (transcurrido >= duracion('salto')) {
                    this.pasarA('recuperar', ahora);
                    return 'aterrizaje';
                }
                return null;

            case 'recuperar':
                if (transcurrido >= duracion('recuperar')) {
                    this.pasarA('acechar', ahora);
                }
                return null;

            case 'apagando':
                if (transcurrido >= duracion('apagando')) {
                    this.ultimoApagado = ahora;
                    this.pasarA('acechar', ahora);
                    return 'apagarBraseros';
                }
                return null;

            case 'aturdida':
                if (transcurrido >= duracion('aturdida')) {
                    this.pasarA('acechar', ahora);
                }
                return null;
        }
    }

    //  El farolero ha encendido un brasero de la sala: en la fase 2, eso la aturde
    braseroEncendido(ahora: number): boolean {
        if (this._fase !== 2 || this._estado === 'salto' || this._estado === 'aturdida') {
            return false;
        }

        this.pasarA('aturdida', ahora);

        return true;
    }

    //  Si recibe daño estando dormida, despierta
    despertar(ahora: number) {
        if (this._estado === 'dormida') {
            this.pasarA('acechar', ahora);
        }
    }

    //  Momento (0 a 1) del estado actual, para animar el salto o el aviso
    progreso(ahora: number): number {
        const tiempo = TIEMPOS_GUARDIANA[this._estado as keyof typeof TIEMPOS_GUARDIANA];

        if (!tiempo) {
            return 0;
        }

        const duracion = tiempo * (this._fase === 2 && this._estado !== 'aturdida' ? RAPIDEZ_FASE_2 : 1);

        return Math.min(1, (ahora - this.desde) / duracion);
    }

    private pasarA(estado: EstadoGuardiana, ahora: number) {
        this._estado = estado;
        this.desde = ahora;
    }
}

//  ¿Alcanza el zarpazo al jugador? Es un arco de 120° delante de ella.
//  (dx, dy) va de la Guardiana al jugador; (mx, my) es hacia dónde mira, normalizado.
export function dentroDelZarpazo(dx: number, dy: number, mx: number, my: number): boolean {
    const distancia = Math.hypot(dx, dy);

    if (distancia > ALCANCE_ZARPAZO) {
        return false;
    }
    if (distancia === 0) {
        return true;
    }

    const coseno = (dx * mx + dy * my) / distancia;

    return coseno >= Math.cos(Math.PI / 3);
}
