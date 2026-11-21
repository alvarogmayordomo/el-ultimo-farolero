import { Physics, type Scene, TintModes } from 'phaser';
import { ComportamientoArquero } from '../../core/arquero';
import { Luchador } from '../../core/luchador';
import { ComportamientoSombra } from '../../core/sombra';
import type { DatosEnemigo } from '../../data/esquemas';
import { type Direccion, direccionDe } from './direcciones';

const VELOCIDAD_RETROCESO = 110;

//  Ritmo del parpadeo de aviso antes de atacar o disparar (ms)
const PARPADEO = 70;

//  Un disparo que la escena debe convertir en flecha
export interface Disparo {
    x: number;
    y: number;
    dx: number;
    dy: number;
}

//  Cualquier enemigo normal (Sombra, Arquero, Bruto…). Sus números vienen de
//  src/data/enemigos.json y sus decisiones de src/core (sombra.ts o arquero.ts).
//  Aquí solo se traduce cada estado a movimiento, animación y color.
export class Enemigo extends Physics.Arcade.Sprite {
    declare body: Physics.Arcade.Body;

    readonly luchador: Luchador;
    readonly ia: ComportamientoSombra | ComportamientoArquero;

    private mirando: Direccion = 'abajo';
    private haciaObjetivo = { x: 0, y: 1 };
    private retroceso = { x: 0, y: 0 };
    private inicioEstado = 0;
    private readonly color: number;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        readonly id: string,
        readonly datos: DatosEnemigo
    ) {
        super(scene, x, y, `enemigo-${datos.sprite}`, 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.luchador = new Luchador(datos.estadisticas);
        this.ia =
            datos.comportamiento === 'cuerpo'
                ? new ComportamientoSombra({ ...datos.distancias, ...datos.tiempos, aturdible: datos.aturdible })
                : new ComportamientoArquero({ ...datos.distancias, ...datos.tiempos });

        this.color = datos.color ? Number.parseInt(datos.color.slice(1), 16) : 0xffffff;
        this.setScale(datos.escala);
        //  El cuerpo se define en píxeles del sprite sin escalar; Phaser lo escala solo
        this.body.setSize(10, 8);
        this.body.setOffset(3, 8);
        this.setTint(this.color);
        this.play(`${this.id}-abajo`);
    }

    //  Devuelve un disparo si en este fotograma suelta una flecha
    actualizar(ahora: number, objetivoX: number, objetivoY: number): Disparo | null {
        if (!this.luchador.vivo) {
            return null;
        }

        const centro = this.body.center;
        const dx = objetivoX - centro.x;
        const dy = objetivoY - centro.y;
        const distancia = Math.hypot(dx, dy) || 1;
        const hacia = { x: dx / distancia, y: dy / distancia };

        if (this.ia.actualizar(ahora, distancia)) {
            this.inicioEstado = ahora;

            //  Al empezar a preparar el ataque o a apuntar, fija la dirección:
            //  así el jugador puede apartarse durante el aviso
            if (this.ia.estado === 'preparar' || this.ia.estado === 'apuntar') {
                this.haciaObjetivo = hacia;
            }
        }

        this.setTint(this.color).setTintMode(TintModes.MULTIPLY);
        this.mover(ahora, hacia);

        //  Mira hacia donde se mueve; si está parado, hacia el jugador
        const v = this.body.velocity;
        this.mirando = v.x !== 0 || v.y !== 0 ? direccionDe(v.x, v.y, this.mirando) : direccionDe(dx, dy, this.mirando);
        this.play(`${this.id}-${this.mirando}`, true);

        if (this.ia instanceof ComportamientoArquero && this.ia.tomarDisparo()) {
            return { x: centro.x, y: centro.y, dx: this.haciaObjetivo.x, dy: this.haciaObjetivo.y };
        }

        return null;
    }

    private mover(ahora: number, hacia: { x: number; y: number }) {
        const velocidad = this.datos.velocidad;
        const aviso = () => {
            this.setVelocity(0, 0);
            if (Math.floor((ahora - this.inicioEstado) / PARPADEO) % 2 === 0) {
                this.setTint(0xffffff).setTintMode(TintModes.FILL);
            }
        };

        switch (this.ia.estado) {
            case 'perseguir':
            case 'acercarse':
                this.setVelocity(hacia.x * velocidad, hacia.y * velocidad);
                break;

            case 'alejarse':
                this.setVelocity(-hacia.x * velocidad, -hacia.y * velocidad);
                break;

            case 'preparar':
            case 'apuntar':
                aviso();
                break;

            case 'atacar': {
                const rapida = this.datos.comportamiento === 'cuerpo' ? this.datos.velocidadAtaque : velocidad;
                this.setVelocity(this.haciaObjetivo.x * rapida, this.haciaObjetivo.y * rapida);
                break;
            }

            case 'herida':
                this.setVelocity(this.retroceso.x, this.retroceso.y);
                this.setTint(0xff4040).setTintMode(TintModes.FILL);
                break;

            default:
                this.setVelocity(0, 0);
        }
    }

    //  El jugador lo golpea desde (x, y) con el multiplicador dado. Devuelve el daño hecho.
    recibirGolpe(atacante: Luchador, multiplicador: number, ahora: number, desdeX: number, desdeY: number): number {
        const dano = this.luchador.recibirGolpe(atacante, multiplicador, ahora);

        if (dano === 0) {
            return 0;
        }

        const vx = this.body.center.x - desdeX;
        const vy = this.body.center.y - desdeY;
        const largo = Math.hypot(vx, vy) || 1;
        this.retroceso = { x: (vx / largo) * VELOCIDAD_RETROCESO, y: (vy / largo) * VELOCIDAD_RETROCESO };

        if (this.ia.recibirGolpe(ahora)) {
            this.inicioEstado = ahora;
        } else {
            //  No aturdible: no retrocede, pero se ve el golpe un instante
            this.setTint(0xff4040).setTintMode(TintModes.FILL);
        }

        if (!this.luchador.vivo) {
            this.morir();
        }

        return dano;
    }

    private morir() {
        //  Al morir: una nube de humo en su sitio y desaparece
        this.body.enable = false;
        const humo = this.scene.add.sprite(this.x, this.y, 'fx-humo', 0).setScale(this.datos.escala);
        humo.play('fx-humo');
        humo.once('animationcomplete', () => humo.destroy());
        this.destroy();
    }
}
