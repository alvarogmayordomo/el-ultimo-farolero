import { Physics, type Scene } from 'phaser';
import { ALCANCE_LANZA, VELOCIDAD_LANZA } from '../../core/lanza';
import { type Direccion, VECTORES } from './direcciones';

//  Color dorado de la Lanza (el sprite del pack es una bola de energía celeste)
const COLOR_LANZA = 0xffd27a;

//  La cola del sprite apunta hacia abajo: así va hacia arriba sin girar
const ANGULO: Record<Direccion, number> = { arriba: 0, derecha: 90, abajo: 180, izquierda: -90 };

//  Proyectil de la Lanza de Luz. Vuela en línea recta hasta su alcance,
//  un muro o el primer enemigo. El coste y el enfriamiento están en src/core/lanza.
export class Lanza extends Physics.Arcade.Sprite {
    declare body: Physics.Arcade.Body;

    private readonly origen: { x: number; y: number };

    constructor(scene: Scene, x: number, y: number, direccion: Direccion) {
        super(scene, x, y, 'fx-lanza', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.origen = { x, y };
        this.body.setSize(8, 8);
        this.setTint(COLOR_LANZA);
        this.setAngle(ANGULO[direccion]);
        this.play('fx-lanza');

        const v = VECTORES[direccion];
        this.setVelocity(v.x * VELOCIDAD_LANZA, v.y * VELOCIDAD_LANZA);
    }

    //  Se llama cada fotograma: desaparece al llegar a su alcance
    actualizar() {
        if (Math.hypot(this.x - this.origen.x, this.y - this.origen.y) >= ALCANCE_LANZA) {
            this.apagar();
        }
    }

    //  Se deshace en un destello pequeño
    apagar() {
        if (!this.active) {
            return;
        }

        const destello = this.scene.add.sprite(this.x, this.y, 'fx-humo', 0).setScale(0.5).setTint(COLOR_LANZA);
        destello.play('fx-humo');
        destello.once('animationcomplete', () => destello.destroy());
        this.destroy();
    }
}
