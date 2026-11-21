import { Physics, type Scene, TintModes } from 'phaser';
import { Luchador } from '../../core/luchador';
import { ComportamientoSombra } from '../../core/sombra';
import { type Direccion, direccionDe } from './direcciones';

//  El sprite del pack es un fantasma blanco: se tiñe de violeta para que sea una Sombra
const COLOR_SOMBRA = 0x8a6fd1;

//  Velocidades en píxeles por segundo
const VELOCIDAD_PERSECUCION = 42;
const VELOCIDAD_EMBESTIDA = 150;
const VELOCIDAD_RETROCESO = 110;

//  Ritmo del parpadeo de aviso antes de atacar (ms)
const PARPADEO = 70;

//  Un enemigo Sombra. Las decisiones las toma ComportamientoSombra (src/core);
//  aquí solo se traduce cada estado a movimiento, animación y color.
export class Sombra extends Physics.Arcade.Sprite {
    declare body: Physics.Arcade.Body;

    readonly luchador = new Luchador({ pv: 30, atq: 12, def: 0 });
    readonly ia = new ComportamientoSombra();

    private mirando: Direccion = 'abajo';
    private haciaObjetivo = { x: 0, y: 1 };
    private retroceso = { x: 0, y: 0 };
    private inicioEstado = 0;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'sombra', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(10, 8);
        this.body.setOffset(3, 8);
        this.setTint(COLOR_SOMBRA);
        this.play('sombra-abajo');
    }

    actualizar(ahora: number, objetivoX: number, objetivoY: number) {
        if (!this.luchador.vivo) {
            return;
        }

        const centro = this.body.center;
        const dx = objetivoX - centro.x;
        const dy = objetivoY - centro.y;
        const distancia = Math.hypot(dx, dy);

        if (this.ia.actualizar(ahora, distancia)) {
            this.inicioEstado = ahora;

            //  Al empezar a preparar el ataque fija la dirección de la embestida
            if (this.ia.estado === 'preparar') {
                this.haciaObjetivo = { x: dx / (distancia || 1), y: dy / (distancia || 1) };
            }
        }

        this.setTint(COLOR_SOMBRA).setTintMode(TintModes.MULTIPLY);

        switch (this.ia.estado) {
            case 'quieta':
            case 'recuperar':
                this.setVelocity(0, 0);
                break;

            case 'perseguir':
                this.setVelocity(
                    (dx / (distancia || 1)) * VELOCIDAD_PERSECUCION,
                    (dy / (distancia || 1)) * VELOCIDAD_PERSECUCION
                );
                break;

            case 'preparar':
                //  Aviso: parpadea en blanco antes de embestir
                this.setVelocity(0, 0);
                if (Math.floor((ahora - this.inicioEstado) / PARPADEO) % 2 === 0) {
                    this.setTint(0xffffff).setTintMode(TintModes.FILL);
                }
                break;

            case 'atacar':
                this.setVelocity(
                    this.haciaObjetivo.x * VELOCIDAD_EMBESTIDA,
                    this.haciaObjetivo.y * VELOCIDAD_EMBESTIDA
                );
                break;

            case 'herida':
                this.setVelocity(this.retroceso.x, this.retroceso.y);
                this.setTint(0xff4040).setTintMode(TintModes.FILL);
                break;
        }

        //  Mira hacia donde se mueve; si está parada, hacia el jugador
        const v = this.body.velocity;
        this.mirando = v.x !== 0 || v.y !== 0 ? direccionDe(v.x, v.y, this.mirando) : direccionDe(dx, dy, this.mirando);
        this.play(`sombra-${this.mirando}`, true);
    }

    //  El jugador la golpea desde (x, y). Devuelve el daño hecho.
    recibirGolpe(atacante: Luchador, multiplicador: number, ahora: number, desdeX: number, desdeY: number): number {
        const dano = this.luchador.recibirGolpe(atacante, multiplicador, ahora);

        if (dano === 0) {
            return 0;
        }

        const vx = this.body.center.x - desdeX;
        const vy = this.body.center.y - desdeY;
        const largo = Math.hypot(vx, vy) || 1;
        this.retroceso = { x: (vx / largo) * VELOCIDAD_RETROCESO, y: (vy / largo) * VELOCIDAD_RETROCESO };
        this.ia.recibirGolpe(ahora);
        this.inicioEstado = ahora;

        if (!this.luchador.vivo) {
            this.morir();
        }

        return dano;
    }

    private morir() {
        //  Al morir: una nube de humo en su sitio y desaparece
        this.body.enable = false;
        const humo = this.scene.add.sprite(this.x, this.y, 'fx-humo', 0);
        humo.play('fx-humo');
        humo.once('animationcomplete', () => humo.destroy());
        this.destroy();
    }
}
