import { Math as PhaserMath, Scene, Tilemaps } from 'phaser';

type Direccion = 'abajo' | 'arriba' | 'izquierda' | 'derecha';

//  Velocidad del farolero en píxeles por segundo
const VELOCIDAD = 80;

export class Game extends Scene
{
    mapa: Phaser.Tilemaps.Tilemap;
    muros: Phaser.Tilemaps.TilemapLayer;
    jugador: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    flechas: Phaser.Types.Input.Keyboard.CursorKeys;
    wasd: Record<'arriba' | 'abajo' | 'izquierda' | 'derecha', Phaser.Input.Keyboard.Key>;
    mirando: Direccion = 'abajo';

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.crearMapa();
        this.crearJugador();
        this.crearControles();
    }

    update ()
    {
        this.moverJugador();
    }

    private crearMapa ()
    {
        //  Mapa de Tiled: el nombre de cada tileset debe coincidir con el del .tmj
        this.mapa = this.make.tilemap({ key: 'mapa-prueba' });
        const suelo = this.mapa.addTilesetImage('suelo-interior', 'tiles-suelo');
        const muros = this.mapa.addTilesetImage('muros-simples', 'tiles-muros');

        if (!suelo || !muros)
        {
            throw new Error('No se han podido cargar los tilesets del mapa');
        }

        this.mapa.createLayer('suelo', suelo);
        const capaMuros = this.mapa.createLayer('muros', muros);

        //  En Phaser 4, createLayer puede devolver una capa GPU (sin colisiones por baldosa).
        //  Sin el parámetro `gpu` devuelve una TilemapLayer normal; lo comprobamos para TypeScript.
        if (!(capaMuros instanceof Tilemaps.TilemapLayer))
        {
            throw new Error('El mapa no tiene la capa «muros»');
        }

        this.muros = capaMuros;
    }

    private crearJugador ()
    {
        //  El punto «inicio» se coloca en Tiled, en la capa de objetos «objetos»
        const inicio = this.mapa.findObject('objetos', (objeto) => objeto.name === 'inicio');
        const x = inicio?.x ?? 0;
        const y = inicio?.y ?? 0;

        this.jugador = this.physics.add.sprite(x, y, 'farolero-quieto', 0);
        this.jugador.play('quieto-abajo');
    }

    private crearControles ()
    {
        const teclado = this.input.keyboard;

        if (!teclado)
        {
            throw new Error('No hay teclado disponible');
        }

        this.flechas = teclado.createCursorKeys();
        this.wasd = {
            arriba: teclado.addKey('W'),
            abajo: teclado.addKey('S'),
            izquierda: teclado.addKey('A'),
            derecha: teclado.addKey('D')
        };
    }

    private moverJugador ()
    {
        const izquierda = this.flechas.left.isDown || this.wasd.izquierda.isDown;
        const derecha = this.flechas.right.isDown || this.wasd.derecha.isDown;
        const arriba = this.flechas.up.isDown || this.wasd.arriba.isDown;
        const abajo = this.flechas.down.isDown || this.wasd.abajo.isDown;

        const dx = Number(derecha) - Number(izquierda);
        const dy = Number(abajo) - Number(arriba);

        //  En diagonal se normaliza el vector para no ir más rápido que en recto
        const velocidad = new PhaserMath.Vector2(dx, dy).normalize().scale(VELOCIDAD);
        this.jugador.setVelocity(velocidad.x, velocidad.y);

        if (dx === 0 && dy === 0)
        {
            this.jugador.play(`quieto-${this.mirando}`, true);
            return;
        }

        //  En diagonal manda el eje horizontal, como en los Zelda cenitales
        if (dx !== 0)
        {
            this.mirando = dx < 0 ? 'izquierda' : 'derecha';
        }
        else
        {
            this.mirando = dy < 0 ? 'arriba' : 'abajo';
        }

        this.jugador.play(`andar-${this.mirando}`, true);
    }
}
