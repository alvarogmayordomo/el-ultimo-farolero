import { Physics, type Scene } from 'phaser';
import type { Luchador } from '../../core/luchador';

//  Flecha de un Arquero. Vuela en línea recta hasta su alcance o un muro; si toca al
//  farolero le hace daño con la fórmula de siempre (vía Farolero.recibirGolpe).
export class Flecha extends Physics.Arcade.Image {
    declare body: Physics.Arcade.Body;

    private readonly origen: { x: number; y: number };

    constructor(
        scene: Scene,
        x: number,
        y: number,
        dx: number,
        dy: number,
        readonly tirador: Luchador,
        readonly multiplicador: number,
        velocidad: number,
        private readonly alcance: number
    ) {
        super(scene, x, y, 'fx-flecha');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.origen = { x, y };
        //  El sprite apunta a la derecha
        this.setRotation(Math.atan2(dy, dx));
        this.body.setSize(4, 4);
        this.setVelocity(dx * velocidad, dy * velocidad);
    }

    actualizar() {
        if (Math.hypot(this.x - this.origen.x, this.y - this.origen.y) >= this.alcance) {
            this.destroy();
        }
    }
}
