import { Physics, type Scene } from 'phaser';

//  Algo que se recoge al pasar por encima: un objeto de equipo o una poción.
//  Flota arriba y abajo para que se vea en la penumbra.
export class Recogible extends Physics.Arcade.Image {
    declare body: Physics.Arcade.Body;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        //  Id de objetos.json, o «pocion»
        readonly tipo: string,
        //  Clave única «nivel:id de Tiled», para no volver a ponerlo tras guardar
        readonly clave: string
    ) {
        super(scene, x, y, tipo === 'pocion' ? 'objeto-pocion' : `objeto-${tipo}`);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
        this.body.setSize(10, 10);

        scene.tweens.add({ targets: this, y: y - 2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
}
