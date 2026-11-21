import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width, height } = this.scale;

        //  El fondo de la plantilla es de 1024×768: se escala para cubrir el lienzo
        this.background = this.add.image(width / 2, height / 2, 'background');
        this.background.setScale(Math.max(width / this.background.width, height / this.background.height));

        this.logo = this.add.image(width / 2, height / 2 - 50, 'logo').setScale(0.6);

        this.title = this.add.text(width / 2, height / 2 + 50, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {

            this.scene.start('Game');

        });
    }
}
