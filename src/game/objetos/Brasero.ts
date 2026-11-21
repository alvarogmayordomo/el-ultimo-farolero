import { Physics, type Scene } from 'phaser';
import { Brasero as ReglasBrasero } from '../../core/brasero';
import type { Luz } from '../../core/luz';

//  Fotogramas de la hoja «mazmorra» (TilesetDungeon, 12 columnas de 16×16):
//  el pedestal de piedra vacío y el mismo con la brasa encendida
const FOTOGRAMA_APAGADO = 38;
const FOTOGRAMA_ENCENDIDO = 26;

//  Un brasero del mapa. Las reglas (encender, recargar, apagar) están en src/core/brasero;
//  aquí solo se dibuja el pedestal, la llama y se bloquea el paso.
export class Brasero extends Physics.Arcade.Image {
    declare body: Physics.Arcade.StaticBody;

    readonly reglas = new ReglasBrasero();
    private llama: Phaser.GameObjects.Sprite;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        //  Clave única «nivel:id de Tiled», la que se guarda en la partida
        readonly clave: string
    ) {
        super(scene, x, y, 'mazmorra', FOTOGRAMA_APAGADO);
        scene.add.existing(this);
        //  Cuerpo estático: el farolero y los enemigos chocan con él
        scene.physics.add.existing(this, true);
        this.body.setSize(12, 10);

        //  La llama se dibuja encima del pedestal y solo se ve encendido
        this.llama = scene.add.sprite(x, y - 9, 'fx-fuego', 3);
        this.llama.setVisible(false);
    }

    //  El farolero intenta encenderlo desde (x, y). Devuelve true si se enciende ahora.
    encender(x: number, y: number, luz: Luz): boolean {
        if (!this.reglas.encender(this.distanciaA(x, y), luz)) {
            return false;
        }

        this.mostrarEncendido(true);

        return true;
    }

    //  Encendido desde una partida guardada (sin llenar la Luz)
    restaurar() {
        this.reglas.restaurarEncendido();
        this.mostrarEncendido(true);
    }

    //  La Guardiana lo apaga: humo y fuera la llama
    apagar() {
        if (!this.reglas.apagar()) {
            return;
        }

        this.mostrarEncendido(false);
        const humo = this.scene.add.sprite(this.x, this.y - 8, 'fx-humo', 0).setScale(0.6);
        humo.play('fx-humo');
        humo.once('animationcomplete', () => humo.destroy());
    }

    get encendido(): boolean {
        return this.reglas.encendido;
    }

    distanciaA(x: number, y: number): number {
        return Math.hypot(x - this.x, y - this.y);
    }

    private mostrarEncendido(encendido: boolean) {
        this.setFrame(encendido ? FOTOGRAMA_ENCENDIDO : FOTOGRAMA_APAGADO);
        this.llama.setVisible(encendido);

        if (encendido) {
            this.llama.play('fx-fuego');
        } else {
            this.llama.stop();
        }
    }
}
