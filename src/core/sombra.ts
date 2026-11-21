//  Comportamiento cuerpo a cuerpo (la Sombra y el Bruto): una máquina de estados pura
//  (sin Phaser). La escena le dice cada fotograma a qué distancia está el jugador, y el
//  enemigo decide qué hace. La escena solo mueve el sprite según el estado.
//
//   quieta ──(jugador cerca)──▶ perseguir ──(a su alcance)──▶ preparar
//     ▲                            │  ▲                          │ (aviso: parpadea)
//     └────(jugador lejos)─────────┘  │                          ▼
//                                     └──── recuperar ◀──── atacar (embestida)
//
//   Un golpe del jugador lo deja «herido» un momento (cancela su ataque) y después
//   vuelve a perseguir. Un enemigo no aturdible (el Bruto) no cancela su ataque.
//
//   Los números de cada enemigo vienen de src/data/enemigos.json.

export type EstadoSombra = 'quieta' | 'perseguir' | 'preparar' | 'atacar' | 'recuperar' | 'herida';

//  Distancias en píxeles y tiempos en ms
export interface ConfigCuerpo {
    deteccion: number;
    olvido: number;
    alcance: number;
    preparar: number;
    atacar: number;
    recuperar: number;
    herida: number;
    //  ¿Un golpe le corta el ataque?
    aturdible: boolean;
}

//  Los valores de la Sombra, que también son los de por defecto
export const DISTANCIA_DETECCION = 96;
export const DISTANCIA_OLVIDO = 140;
export const DISTANCIA_ALCANCE = 22;
export const TIEMPO_PREPARAR = 450;
export const TIEMPO_ATACAR = 220;
export const TIEMPO_RECUPERAR = 600;
export const TIEMPO_HERIDA = 250;

export const CONFIG_SOMBRA: ConfigCuerpo = {
    deteccion: DISTANCIA_DETECCION,
    olvido: DISTANCIA_OLVIDO,
    alcance: DISTANCIA_ALCANCE,
    preparar: TIEMPO_PREPARAR,
    atacar: TIEMPO_ATACAR,
    recuperar: TIEMPO_RECUPERAR,
    herida: TIEMPO_HERIDA,
    aturdible: true
};

export class ComportamientoSombra {
    private _estado: EstadoSombra = 'quieta';
    private desde = 0;

    constructor(private readonly config: ConfigCuerpo = CONFIG_SOMBRA) {}

    get estado(): EstadoSombra {
        return this._estado;
    }

    //  Devuelve true si el estado ha cambiado en esta llamada
    actualizar(ahora: number, distanciaAlJugador: number): boolean {
        const c = this.config;
        const transcurrido = ahora - this.desde;

        switch (this._estado) {
            case 'quieta':
                if (distanciaAlJugador <= c.deteccion) {
                    return this.pasarA('perseguir', ahora);
                }
                break;

            case 'perseguir':
                if (distanciaAlJugador > c.olvido) {
                    return this.pasarA('quieta', ahora);
                }
                if (distanciaAlJugador <= c.alcance) {
                    return this.pasarA('preparar', ahora);
                }
                break;

            case 'preparar':
                if (transcurrido >= c.preparar) {
                    return this.pasarA('atacar', ahora);
                }
                break;

            case 'atacar':
                if (transcurrido >= c.atacar) {
                    return this.pasarA('recuperar', ahora);
                }
                break;

            case 'recuperar':
                if (transcurrido >= c.recuperar) {
                    return this.pasarA('perseguir', ahora);
                }
                break;

            case 'herida':
                if (transcurrido >= c.herida) {
                    return this.pasarA('perseguir', ahora);
                }
                break;
        }

        return false;
    }

    //  El jugador lo ha golpeado. Devuelve true si eso lo deja herido (aturdido).
    //  Un enemigo no aturdible sigue con su ataque, pero si estaba quieto se despierta.
    recibirGolpe(ahora: number): boolean {
        if (!this.config.aturdible) {
            if (this._estado === 'quieta') {
                this.pasarA('perseguir', ahora);
            }
            return false;
        }

        return this.pasarA('herida', ahora);
    }

    //  Solo hace daño mientras embiste
    get haceDano(): boolean {
        return this._estado === 'atacar';
    }

    private pasarA(estado: EstadoSombra, ahora: number): boolean {
        this._estado = estado;
        this.desde = ahora;

        return true;
    }
}
