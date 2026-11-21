import { Math as PhaserMath, Scene, Tilemaps } from 'phaser';

type Direccion = 'abajo' | 'arriba' | 'izquierda' | 'derecha';

//  Velocidad del farolero en píxeles por segundo
const VELOCIDAD = 80;

//  Radio de luz alrededor del farolero, fijo en H1. En H3 dependerá de la Luz
//  (de 48 px con Luz 0 a 160 px con Luz 100).
const RADIO_LUZ = 100;

//  Margen de la capa de oscuridad alrededor de la vista: la cámara se coloca
//  después de update(), así que la capa va un fotograma por detrás y el margen
//  evita que asome un borde sin oscurecer.
const MARGEN_OSCURIDAD = 32;

export class Game extends Scene
{
    mapa: Phaser.Tilemaps.Tilemap;
    muros: Phaser.Tilemaps.TilemapLayer;
    jugador: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    flechas: Phaser.Types.Input.Keyboard.CursorKeys;
    wasd: Record<'arriba' | 'abajo' | 'izquierda' | 'derecha', Phaser.Input.Keyboard.Key>;
    mirando: Direccion = 'abajo';
    oscuridad: Phaser.GameObjects.RenderTexture;

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
        this.crearCamara();
        this.crearOscuridad();
    }

    update ()
    {
        this.moverJugador();
        this.actualizarOscuridad();
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

    private crearCamara ()
    {
        const ancho = this.mapa.widthInPixels;
        const alto = this.mapa.heightInPixels;

        //  Zoom ×2: el lienzo de 640×360 muestra 320×180 píxeles del mundo.
        //  Los límites impiden que la cámara enseñe lo que hay fuera del mapa.
        const camara = this.cameras.main;
        camara.setZoom(2);
        camara.setBounds(0, 0, ancho, alto);
        camara.startFollow(this.jugador, true);

        this.physics.world.setBounds(0, 0, ancho, alto);
        this.jugador.setCollideWorldBounds(true);
    }

    private crearOscuridad ()
    {
        //  Textura «luz»: un círculo blanco que se desvanece hacia el borde. Al borrar
        //  con ella, la oscuridad desaparece del todo en el centro y poco a poco hacia fuera.
        if (!this.textures.exists('luz'))
        {
            const lienzo = this.textures.createCanvas('luz', RADIO_LUZ * 2, RADIO_LUZ * 2);

            if (!lienzo)
            {
                throw new Error('No se ha podido crear la textura de luz');
            }

            const ctx = lienzo.getContext();
            const degradado = ctx.createRadialGradient(RADIO_LUZ, RADIO_LUZ, 0, RADIO_LUZ, RADIO_LUZ, RADIO_LUZ);
            degradado.addColorStop(0, 'rgba(255, 255, 255, 1)');
            degradado.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
            degradado.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = degradado;
            ctx.fillRect(0, 0, RADIO_LUZ * 2, RADIO_LUZ * 2);
            lienzo.refresh();
        }

        //  Capa negra del tamaño de la vista (320×180) más un margen, por encima de todo
        const camara = this.cameras.main;
        this.oscuridad = this.add.renderTexture(
            0, 0,
            camara.width / camara.zoom + MARGEN_OSCURIDAD * 2,
            camara.height / camara.zoom + MARGEN_OSCURIDAD * 2
        );
        this.oscuridad.setOrigin(0, 0);
        this.oscuridad.setDepth(1000);
    }

    private actualizarOscuridad ()
    {
        //  Cada fotograma: se coloca la capa sobre la vista, se pinta de negro
        //  y se borra un círculo de luz centrado en el farolero
        const vista = this.cameras.main.worldView;
        const x = Math.floor(vista.x) - MARGEN_OSCURIDAD;
        const y = Math.floor(vista.y) - MARGEN_OSCURIDAD;

        this.oscuridad.setPosition(x, y);
        this.oscuridad.fill(0x000000, 1);
        //  Al borrar con una textura, Phaser 4 la coloca por su centro (como stamp)
        this.oscuridad.erase('luz', this.jugador.x - x, this.jugador.y - y);
        this.oscuridad.render();
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
