import { Scene } from 'phaser';

//  Primera escena: no carga nada, solo da paso al Preloader (que tiene su propia barra)
export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    create() {
        this.scene.start('Preloader');
    }
}
