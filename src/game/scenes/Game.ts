import { Geom, Input, Scene, Tilemaps } from 'phaser';
import { Golpe } from '../../core/combo';
import { Farolero } from '../objetos/Farolero';
import { Sombra } from '../objetos/Sombra';
import { VECTORES } from '../objetos/direcciones';

//  Radio de luz alrededor del farolero, fijo de momento. En H3 dependerá de la Luz
//  (de 48 px con Luz 0 a 160 px con Luz 100).
const RADIO_LUZ = 100;

//  Margen de la capa de oscuridad alrededor de la vista: la cámara se coloca
//  después de update(), así que la capa va un fotograma por detrás y el margen
//  evita que asome un borde sin oscurecer.
const MARGEN_OSCURIDAD = 32;

//  Ángulo del efecto de tajo (el sprite apunta a la derecha)
const ANGULO_TAJO = { derecha: 0, abajo: 90, izquierda: 180, arriba: -90 };

interface Teclas
{
    flechas: Phaser.Types.Input.Keyboard.CursorKeys;
    arriba: Input.Keyboard.Key;
    abajo: Input.Keyboard.Key;
    izquierda: Input.Keyboard.Key;
    derecha: Input.Keyboard.Key;
    atacar: Input.Keyboard.Key[];
    esquivar: Input.Keyboard.Key[];
}

export class Game extends Scene
{
    mapa: Phaser.Tilemaps.Tilemap;
    muros: Phaser.Tilemaps.TilemapLayer;
    jugador: Farolero;
    sombras: Sombra[];
    teclas: Teclas;
    oscuridad: Phaser.GameObjects.RenderTexture;

    //  Golpe del combo en curso y Sombras que ya ha alcanzado (cada golpe daña una vez)
    private golpeEnCurso: Golpe | null = null;
    private alcanzadas = new Set<Sombra>();

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.golpeEnCurso = null;
        this.alcanzadas.clear();

        this.crearMapa();
        this.crearPersonajes();
        this.crearControles();
        this.crearColisiones();
        this.crearCamara();
        this.crearOscuridad();
    }

    update (ahora: number)
    {
        const golpe = this.jugador.actualizar(ahora, this.leerEntrada());

        if (golpe)
        {
            this.empezarGolpe(golpe);
        }

        this.comprobarGolpeDelJugador(ahora);

        const objetivo = this.jugador.body.center;
        this.sombras = this.sombras.filter((sombra) => sombra.active);
        this.sombras.forEach((sombra) => sombra.actualizar(ahora, objetivo.x, objetivo.y));

        this.comprobarAtaquesDeSombras(ahora);
        this.actualizarOscuridad();

        if (!this.jugador.luchador.vivo)
        {
            this.scene.start('GameOver');
        }
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

    private crearPersonajes ()
    {
        //  Los puntos «inicio» y «sombra» se colocan en Tiled, en la capa de objetos «objetos»
        const inicio = this.mapa.findObject('objetos', (objeto) => objeto.name === 'inicio');
        this.jugador = new Farolero(this, inicio?.x ?? 0, inicio?.y ?? 0);

        this.sombras = this.mapa
            .filterObjects('objetos', (objeto) => objeto.name === 'sombra')
            ?.map((punto) => new Sombra(this, punto.x ?? 0, punto.y ?? 0)) ?? [];
    }

    private crearColisiones ()
    {
        this.physics.add.collider(this.jugador, this.muros);
        //  En un grupo, las Sombras que mueren salen solas y el collider no las toca
        this.physics.add.collider(this.add.group(this.sombras), this.muros);
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

    private crearControles ()
    {
        const teclado = this.input.keyboard;

        if (!teclado)
        {
            throw new Error('No hay teclado disponible');
        }

        //  Atacar: J o Espacio. Esquivar: K o Mayúsculas.
        this.teclas = {
            flechas: teclado.createCursorKeys(),
            arriba: teclado.addKey('W'),
            abajo: teclado.addKey('S'),
            izquierda: teclado.addKey('A'),
            derecha: teclado.addKey('D'),
            atacar: [teclado.addKey('J'), teclado.addKey('SPACE')],
            esquivar: [teclado.addKey('K'), teclado.addKey('SHIFT')]
        };

        //  F2 muestra u oculta las cajas de colisión (ayuda de desarrollo)
        teclado.addKey('F2').on('down', () => this.alternarDebugFisicas());
    }

    //  Traduce el teclado a la entrada que entiende el farolero
    private leerEntrada ()
    {
        const t = this.teclas;
        const izquierda = t.flechas.left.isDown || t.izquierda.isDown;
        const derecha = t.flechas.right.isDown || t.derecha.isDown;
        const arriba = t.flechas.up.isDown || t.arriba.isDown;
        const abajo = t.flechas.down.isDown || t.abajo.isDown;
        const recienPulsada = (teclas: Input.Keyboard.Key[]) => teclas.some((tecla) => Input.Keyboard.JustDown(tecla));

        return {
            dx: Number(derecha) - Number(izquierda),
            dy: Number(abajo) - Number(arriba),
            atacar: recienPulsada(t.atacar),
            esquivar: recienPulsada(t.esquivar)
        };
    }

    private empezarGolpe (golpe: Golpe)
    {
        this.golpeEnCurso = golpe;
        this.alcanzadas.clear();

        //  Efecto de tajo delante del farolero, girado hacia donde mira
        const mirando = this.jugador.mirando;
        const v = VECTORES[mirando];
        const centro = this.jugador.body.center;
        const tajo = this.add.sprite(centro.x + v.x * 12, centro.y + v.y * 12 - 4, 'fx-tajo', 0);
        tajo.setAngle(ANGULO_TAJO[mirando]);
        tajo.setFlipY(golpe.numero === 2);
        tajo.play('fx-tajo');
        tajo.once('animationcomplete', () => tajo.destroy());
    }

    //  Mientras dura el golpe, cada Sombra dentro de la zona recibe daño una sola vez
    private comprobarGolpeDelJugador (ahora: number)
    {
        const golpe = this.golpeEnCurso;

        if (!golpe || !this.jugador.combo.golpeActivo(ahora))
        {
            this.golpeEnCurso = null;
            return;
        }

        const zona = this.jugador.zonaDeGolpe();
        const centro = this.jugador.body.center;

        for (const sombra of this.sombras)
        {
            if (!sombra.active || this.alcanzadas.has(sombra))
            {
                continue;
            }

            if (Geom.Intersects.RectangleToRectangle(zona, sombra.getBounds()))
            {
                this.alcanzadas.add(sombra);
                sombra.recibirGolpe(this.jugador.luchador, golpe.multiplicador, ahora, centro.x, centro.y);
            }
        }
    }

    //  Una Sombra que embiste y toca al farolero le hace daño (salvo si está esquivando)
    private comprobarAtaquesDeSombras (ahora: number)
    {
        const cuerpoJugador = this.cuerpoComoRectangulo(this.jugador.body);

        for (const sombra of this.sombras)
        {
            if (!sombra.ia.haceDano || !this.jugador.esVulnerable(ahora))
            {
                continue;
            }

            if (Geom.Intersects.RectangleToRectangle(cuerpoJugador, this.cuerpoComoRectangulo(sombra.body)))
            {
                this.jugador.recibirGolpe(sombra.luchador, ahora, sombra.body.center.x, sombra.body.center.y);
            }
        }
    }

    private cuerpoComoRectangulo (cuerpo: Phaser.Physics.Arcade.Body): Geom.Rectangle
    {
        return new Geom.Rectangle(cuerpo.x, cuerpo.y, cuerpo.width, cuerpo.height);
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
}
