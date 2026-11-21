import { Physics, Scene } from 'phaser';
import { Brasero as ReglasBrasero } from '../../core/brasero';
import { Luz } from '../../core/luz';

//  Fotogramas de la hoja «mazmorra» (TilesetDungeon, 12 columnas de 16×16):
//  el pedestal de piedra vacío y el mismo con la brasa encendida
const FOTOGRAMA_APAGADO = 38;
const FOTOGRAMA_ENCENDIDO = 26;

//  Un brasero del mapa. Las reglas (encender, recargar) están en src/core/brasero;
//  aquí solo se dibuja el pedestal, la llama y se bloquea el paso.
export class Brasero extends Physics.Arcade.Image
{
    declare body: Physics.Arcade.StaticBody;

    readonly reglas = new ReglasBrasero();
    private llama: Phaser.GameObjects.Sprite;

    constructor (scene: Scene, x: number, y: number)
    {
        super(scene, x, y, 'mazmorra', FOTOGRAMA_APAGADO);
        scene.add.existing(this);
        //  Cuerpo estático: el farolero y las Sombras chocan con él
        scene.physics.add.existing(this, true);
        this.body.setSize(12, 10);

        //  La llama se dibuja encima del pedestal y solo se ve encendido
        this.llama = scene.add.sprite(x, y - 9, 'fx-fuego', 3);
        this.llama.setVisible(false);
    }

    //  El farolero intenta encenderlo desde (x, y). Devuelve true si se enciende ahora.
    encender (x: number, y: number, luz: Luz): boolean
    {
        if (!this.reglas.encender(this.distanciaA(x, y), luz))
        {
            return false;
        }

        this.setFrame(FOTOGRAMA_ENCENDIDO);
        this.llama.setVisible(true).play('fx-fuego');

        return true;
    }

    get encendido (): boolean
    {
        return this.reglas.encendido;
    }

    distanciaA (x: number, y: number): number
    {
        return Math.hypot(x - this.x, y - this.y);
    }
}
