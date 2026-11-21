import { Scene } from 'phaser';
import { COLORES, estiloTexto } from '../estilo';
import { crearMenu } from '../Menu';

//  «Has caído». La partida ya se ha devuelto al último brasero (ver Game.morir).
export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(COLORES.fondo);
        this.cameras.main.fadeIn(600, 0, 0, 0);

        this.add.text(width / 2, height / 2 - 50, 'Has caído', estiloTexto(30, COLORES.peligro)).setOrigin(0.5);
        this.add
            .text(width / 2, height / 2 - 18, 'La llama vuelve al último brasero que encendiste.', estiloTexto(10))
            .setOrigin(0.5);

        crearMenu(this, width / 2, height / 2 + 30, [
            { texto: 'Levantarse', accion: () => this.scene.start('Game') },
            {
                texto: 'Volver al título',
                accion: () => {
                    this.registry.remove('partida');
                    this.scene.start('MainMenu');
                }
            }
        ]);
    }
}
