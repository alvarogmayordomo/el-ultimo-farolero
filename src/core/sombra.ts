//  Comportamiento de la Sombra: una máquina de estados pura (sin Phaser).
//  La escena le dice cada fotograma a qué distancia está el jugador, y la Sombra
//  decide qué hace. La escena solo mueve el sprite según el estado.
//
//   quieta ──(jugador cerca)──▶ perseguir ──(a su alcance)──▶ preparar
//     ▲                            │  ▲                          │ (aviso: parpadea)
//     └────(jugador lejos)─────────┘  │                          ▼
//                                     └──── recuperar ◀──── atacar (embestida)
//
//   Un golpe del jugador en cualquier estado la deja «herida» un momento
//   (cancela su ataque) y después vuelve a perseguir.

export type EstadoSombra = 'quieta' | 'perseguir' | 'preparar' | 'atacar' | 'recuperar' | 'herida';

//  Distancias en píxeles y tiempos en ms
export const DISTANCIA_DETECCION = 96;
export const DISTANCIA_OLVIDO = 140;
export const DISTANCIA_ALCANCE = 22;
export const TIEMPO_PREPARAR = 450;
export const TIEMPO_ATACAR = 220;
export const TIEMPO_RECUPERAR = 600;
export const TIEMPO_HERIDA = 250;

export class ComportamientoSombra {
    private _estado: EstadoSombra = 'quieta';
    private desde = 0;

    get estado(): EstadoSombra {
        return this._estado;
    }

    //  Devuelve true si el estado ha cambiado en esta llamada
    actualizar(ahora: number, distanciaAlJugador: number): boolean {
        const transcurrido = ahora - this.desde;

        switch (this._estado) {
            case 'quieta':
                if (distanciaAlJugador <= DISTANCIA_DETECCION) {
                    return this.pasarA('perseguir', ahora);
                }
                break;

            case 'perseguir':
                if (distanciaAlJugador > DISTANCIA_OLVIDO) {
                    return this.pasarA('quieta', ahora);
                }
                if (distanciaAlJugador <= DISTANCIA_ALCANCE) {
                    return this.pasarA('preparar', ahora);
                }
                break;

            case 'preparar':
                if (transcurrido >= TIEMPO_PREPARAR) {
                    return this.pasarA('atacar', ahora);
                }
                break;

            case 'atacar':
                if (transcurrido >= TIEMPO_ATACAR) {
                    return this.pasarA('recuperar', ahora);
                }
                break;

            case 'recuperar':
                if (transcurrido >= TIEMPO_RECUPERAR) {
                    return this.pasarA('perseguir', ahora);
                }
                break;

            case 'herida':
                if (transcurrido >= TIEMPO_HERIDA) {
                    return this.pasarA('perseguir', ahora);
                }
                break;
        }

        return false;
    }

    //  El jugador la ha golpeado: queda aturdida un momento y pierde su ataque
    recibirGolpe(ahora: number) {
        this.pasarA('herida', ahora);
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
