import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        const { width, height } = this.scale;

        //  We loaded this image in our Boot Scene, so we can display it here
        const background = this.add.image(width / 2, height / 2, 'background');
        background.setScale(Math.max(width / background.width, height / background.height));

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(width / 2, height / 2, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(width / 2 - 230, height / 2, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('logo', 'logo.png');

        //  Mapa de prueba de H1 (Tiled, JSON) y las imágenes de sus tilesets
        this.load.tilemapTiledJSON('mapa-prueba', 'mapas/prueba.tmj');
        this.load.image('tiles-suelo', 'tilesets/suelo-interior.png');
        this.load.image('tiles-muros', 'tilesets/muros-simples.png');

        //  Farolero (NinjaGreen): fotogramas de 32×32; columnas = dirección, filas = fotograma
        this.load.spritesheet('farolero-andar', 'personajes/farolero-andar.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('farolero-quieto', 'personajes/farolero-quieto.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('farolero-ataque', 'personajes/farolero-ataque.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('farolero-esquiva', 'personajes/farolero-esquiva.png', { frameWidth: 32, frameHeight: 32 });

        //  Sombra (Spirit): fotogramas de 16×16, mismo orden que el farolero
        this.load.spritesheet('sombra', 'enemigos/sombra.png', { frameWidth: 16, frameHeight: 16 });

        //  Efectos: tajo del golpe (4 fotogramas, apunta a la derecha) y humo (6 fotogramas)
        this.load.spritesheet('fx-tajo', 'fx/tajo.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('fx-humo', 'fx/humo.png', { frameWidth: 32, frameHeight: 32 });

        //  Lanza de Luz (bola de energía, 4 fotogramas) y llama de los braseros (12 fotogramas de 8×12)
        this.load.spritesheet('fx-lanza', 'fx/lanza.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('fx-fuego', 'fx/fuego.png', { frameWidth: 8, frameHeight: 12 });

        //  Piezas de mazmorra (TilesetDungeon) en fotogramas de 16×16: de aquí sale el brasero
        this.load.spritesheet('mazmorra', 'objetos/mazmorra.png', { frameWidth: 16, frameHeight: 16 });
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Animaciones del farolero: andar-<dir> y quieto-<dir>. En cada hoja la columna
        //  es la dirección (0 abajo, 1 arriba, 2 izquierda, 3 derecha) y hay 4 filas.
        const direcciones = ['abajo', 'arriba', 'izquierda', 'derecha'];

        direcciones.forEach((dir, columna) => {
            const fotogramas = [columna, columna + 4, columna + 8, columna + 12];

            this.anims.create({
                key: `andar-${dir}`,
                frames: this.anims.generateFrameNumbers('farolero-andar', { frames: fotogramas }),
                frameRate: 8,
                repeat: -1
            });

            this.anims.create({
                key: `quieto-${dir}`,
                frames: this.anims.generateFrameNumbers('farolero-quieto', { frames: fotogramas }),
                frameRate: 4,
                repeat: -1
            });

            //  Ataque: un solo fotograma por dirección (la primera fila de la hoja)
            this.anims.create({
                key: `atacar-${dir}`,
                frames: this.anims.generateFrameNumbers('farolero-ataque', { frames: [columna] })
            });

            //  Voltereta: 3 fotogramas por dirección, repartidos en los 0,3 s de la esquiva
            this.anims.create({
                key: `esquivar-${dir}`,
                frames: this.anims.generateFrameNumbers('farolero-esquiva', { frames: [columna, columna + 4, columna + 8] }),
                frameRate: 10
            });

            this.anims.create({
                key: `sombra-${dir}`,
                frames: this.anims.generateFrameNumbers('sombra', { frames: fotogramas }),
                frameRate: 6,
                repeat: -1
            });
        });

        this.anims.create({
            key: 'fx-tajo',
            frames: this.anims.generateFrameNumbers('fx-tajo', { start: 0, end: 3 }),
            frameRate: 20
        });

        this.anims.create({
            key: 'fx-humo',
            frames: this.anims.generateFrameNumbers('fx-humo', { start: 0, end: 5 }),
            frameRate: 14
        });

        this.anims.create({
            key: 'fx-lanza',
            frames: this.anims.generateFrameNumbers('fx-lanza', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: -1
        });

        //  La hoja del fuego es una llama que se apaga: se usan los fotogramas de llama
        //  llena, de ida y vuelta, para que parezca que oscila
        this.anims.create({
            key: 'fx-fuego',
            frames: this.anims.generateFrameNumbers('fx-fuego', { start: 3, end: 7 }),
            frameRate: 8,
            yoyo: true,
            repeat: -1
        });

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
