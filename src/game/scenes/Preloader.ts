import { Scene } from 'phaser';
import { ENEMIGOS, NIVELES, OBJETOS } from '../../data/datos';
import { COLORES, estiloTexto } from '../estilo';

//  Las 4 columnas de cada hoja de personaje: abajo, arriba, izquierda, derecha
const DIRECCIONES = ['abajo', 'arriba', 'izquierda', 'derecha'];

//  Carga todo lo del juego y crea todas las animaciones. Los enemigos, objetos y
//  niveles salen de src/data: añadir uno no exige tocar este archivo.
export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        const { width, height } = this.scale;

        this.add.text(width / 2, height / 2 - 24, 'Encendiendo faroles…', estiloTexto(16)).setOrigin(0.5);
        this.add.rectangle(width / 2, height / 2 + 6, 240, 10).setStrokeStyle(1, 0xf4e9d0);
        const barra = this.add.rectangle(
            width / 2 - 118,
            height / 2 + 6,
            2,
            6,
            Number.parseInt(COLORES.luz.slice(1), 16)
        );
        barra.setOrigin(0, 0.5);

        this.load.on('progress', (progreso: number) => {
            barra.width = 2 + 234 * progreso;
        });
    }

    preload() {
        this.load.setPath('assets');

        //  Mapas de Tiled (uno por nivel) y las imágenes de sus tilesets
        for (const nivel of NIVELES) {
            this.load.tilemapTiledJSON(`mapa-${nivel.mapa}`, `mapas/${nivel.mapa}.tmj`);
        }
        this.load.image('tiles-suelo', 'tilesets/suelo-interior.png');
        this.load.image('tiles-muros', 'tilesets/muros-simples.png');

        //  Farolero (NinjaGreen): fotogramas de 32×32; columnas = dirección, filas = fotograma
        const hoja32 = { frameWidth: 32, frameHeight: 32 };
        this.load.spritesheet('farolero-andar', 'personajes/farolero-andar.png', hoja32);
        this.load.spritesheet('farolero-quieto', 'personajes/farolero-quieto.png', hoja32);
        this.load.spritesheet('farolero-ataque', 'personajes/farolero-ataque.png', hoja32);
        this.load.spritesheet('farolero-esquiva', 'personajes/farolero-esquiva.png', hoja32);

        //  Enemigos de enemigos.json: hojas de 64×64 con fotogramas de 16×16
        for (const sprite of new Set(Object.values(ENEMIGOS).map((e) => e.sprite))) {
            this.load.spritesheet(`enemigo-${sprite}`, `enemigos/${sprite}.png`, { frameWidth: 16, frameHeight: 16 });
        }

        //  La Guardiana del Pozo: fotogramas de 50×50 (5 en reposo, 3 al recibir daño)
        this.load.spritesheet('guardiana', 'jefe/guardiana.png', { frameWidth: 50, frameHeight: 50 });
        this.load.spritesheet('guardiana-herida', 'jefe/guardiana-herida.png', { frameWidth: 50, frameHeight: 50 });

        //  Objetos de objetos.json y la poción
        for (const objeto of Object.values(OBJETOS)) {
            this.load.image(`objeto-${objeto.sprite}`, `objetos/${objeto.sprite}.png`);
        }
        this.load.image('objeto-pocion', 'objetos/pocion.png');

        //  Efectos: tajo del golpe, humo, Lanza de Luz, llama de los braseros y flecha
        this.load.spritesheet('fx-tajo', 'fx/tajo.png', hoja32);
        this.load.spritesheet('fx-humo', 'fx/humo.png', hoja32);
        this.load.spritesheet('fx-lanza', 'fx/lanza.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('fx-fuego', 'fx/fuego.png', { frameWidth: 8, frameHeight: 12 });
        this.load.image('fx-flecha', 'fx/flecha.png');

        //  Piezas de mazmorra (TilesetDungeon) en fotogramas de 16×16: de aquí sale el brasero
        this.load.spritesheet('mazmorra', 'objetos/mazmorra.png', { frameWidth: 16, frameHeight: 16 });
    }

    create() {
        DIRECCIONES.forEach((dir, columna) => {
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
                frames: this.anims.generateFrameNumbers('farolero-esquiva', {
                    frames: [columna, columna + 4, columna + 8]
                }),
                frameRate: 10
            });

            //  Una animación por enemigo y dirección: «<id>-<dir>»
            for (const [id, enemigo] of Object.entries(ENEMIGOS)) {
                this.anims.create({
                    key: `${id}-${dir}`,
                    frames: this.anims.generateFrameNumbers(`enemigo-${enemigo.sprite}`, { frames: fotogramas }),
                    frameRate: 6,
                    repeat: -1
                });
            }
        });

        this.anims.create({
            key: 'guardiana-quieta',
            frames: this.anims.generateFrameNumbers('guardiana', { start: 0, end: 4 }),
            frameRate: 7,
            repeat: -1
        });

        this.anims.create({
            key: 'guardiana-herida',
            frames: this.anims.generateFrameNumbers('guardiana-herida', { start: 0, end: 2 }),
            frameRate: 12
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

        this.scene.start('MainMenu');
    }
}
