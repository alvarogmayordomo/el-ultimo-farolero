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
        this.crearColisiones();
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

        //  Toda baldosa de la capa «muros» bloquea el paso (-1 = casilla vacía)
        this.muros.setCollisionByExclusion([-1]);
    }

    private crearJugador ()
    {
        //  El punto «inicio» se coloca en Tiled, en la capa de objetos «objetos»
        const inicio = this.mapa.findObject('objetos', (objeto) => objeto.name === 'inicio');
        const x = inicio?.x ?? 0;
        const y = inicio?.y ?? 0;

        this.jugador = this.physics.add.sprite(x, y, 'farolero-quieto', 0);
        this.jugador.play('quieto-abajo');

        //  Cuerpo físico pequeño en los pies (el dibujo ocupa ~16 px dentro del marco de 32):
        //  así la cabeza puede solapar un muro que está detrás, como en los Zelda cenitales
        this.jugador.body.setSize(10, 8);
        this.jugador.body.setOffset(11, 16);
    }

    private crearColisiones ()
    {
        this.physics.add.collider(this.jugador, this.muros);
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

        //  F2 muestra u oculta las cajas de colisión (ayuda de desarrollo)
        teclado.addKey('F2').on('down', () => this.alternarDebugFisicas());
    }

    private alternarDebugFisicas ()
    {
        const mundo = this.physics.world;

        //  Con debug: false en la configuración, la capa de depuración aún no existe
        const mostrar = !(mundo.debugGraphic && mundo.debugGraphic.visible && mundo.drawDebug);

        if (!mundo.debugGraphic)
        {
            mundo.createDebugGraphic();
        }

        mundo.drawDebug = mostrar;
        mundo.debugGraphic.clear();
        mundo.debugGraphic.setVisible(mundo.drawDebug);
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
