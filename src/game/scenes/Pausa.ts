import { Scene } from 'phaser';
import { estiloTexto } from '../estilo';
import { crearMenu } from '../Menu';

//  Pausa encima del juego (Esc o P). Game queda en pausa debajo.
export class Pausa extends Scene {
    constructor() {
        super('Pausa');
    }

    create() {
        const { width, height } = this.scale;

        this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);
        this.add.text(width / 2, height / 2 - 50, 'Pausa', estiloTexto(24)).setOrigin(0.5);

        const continuar = () => {
            this.scene.resume('Game');
            this.scene.stop();
        };

        crearMenu(this, width / 2, height / 2, [
            { texto: 'Continuar', accion: continuar },
            {
                texto: 'Volver al título',
                accion: () => {
                    //  Lo no guardado se pierde: la partida sigue desde el último brasero
                    this.registry.remove('partida');
                    this.scene.stop('Game');
                    this.scene.stop('Hud');
                    this.scene.start('MainMenu');
                }
            }
        ]);

        this.add
            .text(
                width / 2,
                height / 2 + 56,
                'Al volver al título, la partida sigue desde el último brasero',
                estiloTexto(8)
            )
            .setOrigin(0.5)
            .setAlpha(0.7);

        this.input.keyboard?.on('keydown-ESC', continuar);
        this.input.keyboard?.on('keydown-P', continuar);
    }
}
