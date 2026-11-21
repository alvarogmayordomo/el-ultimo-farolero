//  Comportamiento a distancia (el Arquero): máquina de estados pura, sin Phaser.
//
//   quieta ──(jugador cerca)──▶ acercarse ──(a tiro)──▶ apuntar ──(dispara)──▶ recargar
//                                 ▲   │                    (aviso)                │
//                                 │   └─(jugador encima)─▶ alejarse ──(a salvo)──┘│
//                                 └──────────────────────────────────────────────┘
//
//   Mantiene la distancia: si el jugador se le echa encima, se aleja antes de apuntar.
//   Al terminar de apuntar deja un disparo pendiente que la escena recoge con
//   tomarDisparo() para crear la flecha. Un golpe lo deja herido y cancela el disparo.

export type EstadoArquero = 'quieta' | 'acercarse' | 'alejarse' | 'apuntar' | 'recargar' | 'herida';

//  Distancias en píxeles y tiempos en ms (vienen de src/data/enemigos.json)
export interface ConfigDistancia {
    deteccion: number;
    olvido: number;
    //  Distancia a la que empieza a apuntar
    alcance: number;
    //  Si el jugador está más cerca que esto, se aleja
    huida: number;
    preparar: number;
    recargar: number;
    herida: number;
}

//  Margen para dejar de huir: se aleja hasta huida + MARGEN_HUIDA
export const MARGEN_HUIDA = 24;

export class ComportamientoArquero {
    private _estado: EstadoArquero = 'quieta';
    private desde = 0;
    private disparoPendiente = false;

    constructor(private readonly config: ConfigDistancia) {}

    get estado(): EstadoArquero {
        return this._estado;
    }

    //  Devuelve true si el estado ha cambiado en esta llamada
    actualizar(ahora: number, distanciaAlJugador: number): boolean {
        const c = this.config;
        const d = distanciaAlJugador;
        const transcurrido = ahora - this.desde;

        switch (this._estado) {
            case 'quieta':
                if (d <= c.deteccion) {
                    return this.pasarA('acercarse', ahora);
                }
                break;

            case 'acercarse':
                if (d > c.olvido) {
                    return this.pasarA('quieta', ahora);
                }
                if (d < c.huida) {
                    return this.pasarA('alejarse', ahora);
                }
                if (d <= c.alcance) {
                    return this.pasarA('apuntar', ahora);
                }
                break;

            case 'alejarse':
                if (d >= c.huida + MARGEN_HUIDA) {
                    return this.pasarA('apuntar', ahora);
                }
                break;

            case 'apuntar':
                if (transcurrido >= c.preparar) {
                    this.disparoPendiente = true;
                    return this.pasarA('recargar', ahora);
                }
                break;

            case 'recargar':
                if (transcurrido >= c.recargar) {
                    return this.pasarA('acercarse', ahora);
                }
                break;

            case 'herida':
                if (transcurrido >= c.herida) {
                    return this.pasarA('acercarse', ahora);
                }
                break;
        }

        return false;
    }

    //  ¿Toca disparar? Devuelve true una sola vez por disparo.
    tomarDisparo(): boolean {
        const pendiente = this.disparoPendiente;
        this.disparoPendiente = false;

        return pendiente;
    }

    recibirGolpe(ahora: number): boolean {
        this.disparoPendiente = false;

        return this.pasarA('herida', ahora);
    }

    //  El Arquero no hace daño al tocar: solo sus flechas
    get haceDano(): boolean {
        return false;
    }

    private pasarA(estado: EstadoArquero, ahora: number): boolean {
        this._estado = estado;
        this.desde = ahora;

        return true;
    }
}
