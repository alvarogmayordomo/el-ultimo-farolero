import { Geom, Input, Scene, Tilemaps } from 'phaser';
import { ALCANCE_ENCENDER, RADIO_LUZ_BRASERO } from '../../core/brasero';
import type { Golpe } from '../../core/combo';
import { MULTIPLICADOR_LANZA } from '../../core/lanza';
import { LUZ_POR_GOLPE } from '../../core/luz';
import { cambiarDeNivel, clave, copiarPartida, type Partida, partidaNueva, trasMorir } from '../../core/partida';
import { ENEMIGOS, NIVELES, OBJETOS, objetoPorId } from '../../data/datos';
import type { DatosNivel } from '../../data/esquemas';
import { borrar, cargar, guardar } from '../../platform/guardado';
import { Oscuridad } from '../Oscuridad';
import { Brasero } from '../objetos/Brasero';
import { VECTORES } from '../objetos/direcciones';
import { Enemigo } from '../objetos/Enemigo';
import { Farolero } from '../objetos/Farolero';
import { Flecha } from '../objetos/Flecha';
import { EXPERIENCIA_GUARDIANA, Guardiana } from '../objetos/Guardiana';
import { Lanza } from '../objetos/Lanza';
import { Recogible } from '../objetos/Recogible';
import type { Hud } from './Hud';

//  Ángulo del efecto de tajo (el sprite apunta a la derecha)
const ANGULO_TAJO = { derecha: 0, abajo: 90, izquierda: 180, arriba: -90 };

//  Al reaparecer junto a un brasero, el farolero sale un poco por debajo de él
const SEPARACION_BRASERO = 18;

interface Teclas {
    flechas: Phaser.Types.Input.Keyboard.CursorKeys;
    arriba: Input.Keyboard.Key;
    abajo: Input.Keyboard.Key;
    izquierda: Input.Keyboard.Key;
    derecha: Input.Keyboard.Key;
    atacar: Input.Keyboard.Key[];
    esquivar: Input.Keyboard.Key[];
    lanzar: Input.Keyboard.Key[];
    encender: Input.Keyboard.Key[];
    beber: Input.Keyboard.Key[];
}

//  De los dos objetos que Phaser pasa a una respuesta de choque, el que es de la clase
//  pedida (o null). Así no importa en qué orden los pase.
// biome-ignore lint/suspicious/noExplicitAny: el constructor de cualquier clase
function deClase<T>(Clase: new (...args: any[]) => T, a: unknown, b: unknown): T | null {
    if (a instanceof Clase) {
        return a;
    }

    return b instanceof Clase ? b : null;
}

//  La partida en curso vive en el registro del juego, compartida entre escenas
export function partidaEnCurso(escena: Scene): Partida {
    const partida = escena.registry.get('partida') as Partida | undefined;

    if (!partida) {
        const nueva = partidaNueva(NIVELES[0].id);
        escena.registry.set('partida', nueva);
        return nueva;
    }

    return partida;
}

//  La escena de juego: carga el nivel de la partida en curso, crea a los personajes,
//  lee el teclado y, cada fotograma, comprueba golpes, luz, objetos y salida.
//  Las reglas están en src/core; aquí solo se conectan con Phaser.
export class Game extends Scene {
    mapa: Phaser.Tilemaps.Tilemap;
    muros: Phaser.Tilemaps.TilemapLayer;
    jugador: Farolero;
    enemigos: Enemigo[];
    braseros: Brasero[];
    recogibles: Phaser.GameObjects.Group;
    lanzas: Phaser.GameObjects.Group;
    flechas: Phaser.GameObjects.Group;
    guardiana: Guardiana | null;
    salida: Geom.Rectangle | null;
    teclas: Teclas;

    private partida: Partida;
    private nivel: DatosNivel;
    private oscuridad: Oscuridad;
    private grupoEnemigos: Phaser.GameObjects.Group;

    //  Golpe del combo en curso y a quién ha alcanzado ya (cada golpe daña una vez)
    private golpeEnCurso: Golpe | null = null;
    private alcanzados = new Set<Enemigo | Guardiana>();

    //  Para no repetir el final (muerte, victoria o cambio de nivel) varias veces
    private terminando = false;

    constructor() {
        super('Game');
    }

    init() {
        this.partida = partidaEnCurso(this);
        this.nivel = NIVELES.find((n) => n.id === this.partida.nivel) ?? NIVELES[0];
        this.golpeEnCurso = null;
        this.alcanzados.clear();
        this.terminando = false;
        this.guardiana = null;
        this.salida = null;
    }

    create() {
        this.crearMapa();
        this.crearObjetosDelMapa();
        this.crearControles();
        this.crearColisiones();
        this.crearCamara();
        this.oscuridad = new Oscuridad(this);

        //  El HUD es otra escena, a 640×360, que se dibuja encima de esta
        this.scene.launch('Hud');
        this.events.once('shutdown', () => this.scene.stop('Hud'));
        this.time.delayedCall(50, () => this.hud()?.anunciar(this.nivel.nombre));

        this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    update(ahora: number, delta: number) {
        if (this.terminando) {
            this.actualizarOscuridad();
            return;
        }

        this.partida.estadisticas.tiempo += delta;

        const entrada = this.leerEntrada();
        const golpe = this.jugador.actualizar(ahora, entrada);

        if (golpe) {
            this.empezarGolpe(golpe);
        }

        if (entrada.lanzar && this.jugador.lanzar(ahora)) {
            this.crearLanza();
        }

        if (entrada.encender) {
            this.encenderBraseroCercano(ahora);
        }

        if (entrada.beber) {
            this.beberPocion();
        }

        this.comprobarGolpeDelJugador(ahora);
        this.actualizarProyectiles();
        this.actualizarEnemigos(ahora);
        this.actualizarGuardiana(ahora);
        this.actualizarLuz(delta);
        this.actualizarOscuridad();
        this.actualizarHud();
        this.comprobarSalida();

        if (!this.jugador.luchador.vivo) {
            this.morir();
        }
    }

    // ── Creación del nivel ───────────────────────────────────────────────

    private crearMapa() {
        //  Mapa de Tiled: el nombre de cada tileset debe coincidir con el del .tmj
        this.mapa = this.make.tilemap({ key: `mapa-${this.nivel.mapa}` });
        const suelo = this.mapa.addTilesetImage('suelo-interior', 'tiles-suelo');
        const muros = this.mapa.addTilesetImage('muros-simples', 'tiles-muros');

        if (!suelo || !muros) {
            throw new Error('No se han podido cargar los tilesets del mapa');
        }

        this.mapa.createLayer('suelo', suelo);
        const capaMuros = this.mapa.createLayer('muros', muros);

        //  En Phaser 4, createLayer puede devolver una capa GPU (sin colisiones por baldosa).
        //  Sin el parámetro `gpu` devuelve una TilemapLayer normal; lo comprobamos para TypeScript.
        if (!(capaMuros instanceof Tilemaps.TilemapLayer)) {
            throw new Error('El mapa no tiene la capa «muros»');
        }

        this.muros = capaMuros;

        //  Toda baldosa de la capa «muros» bloquea el paso (-1 = casilla vacía)
        this.muros.setCollisionByExclusion([-1]);
    }

    //  Recorre la capa «objetos» de Tiled. Cada objeto se reconoce por su nombre:
    //  inicio, salida, brasero, jefe, pocion, un id de enemigos.json o de objetos.json.
    private crearObjetosDelMapa() {
        const objetos = this.mapa.getObjectLayer('objetos')?.objects ?? [];
        const nivel = this.nivel.id;

        this.enemigos = [];
        this.braseros = [];
        this.recogibles = this.add.group();
        this.lanzas = this.add.group();
        this.flechas = this.add.group();

        let inicio = { x: 0, y: 0 };

        for (const objeto of objetos) {
            const x = objeto.x ?? 0;
            const y = objeto.y ?? 0;
            const nombre = objeto.name;
            const suClave = clave(nivel, objeto.id);

            if (nombre === 'inicio') {
                inicio = { x, y };
            } else if (nombre === 'salida') {
                this.salida = new Geom.Rectangle(x, y, objeto.width ?? 16, objeto.height ?? 16);
            } else if (nombre === 'brasero') {
                const brasero = new Brasero(this, x, y, suClave);
                if (this.partida.braseros.includes(suClave)) {
                    brasero.restaurar();
                }
                this.braseros.push(brasero);
            } else if (nombre === 'jefe' && this.nivel.jefe) {
                this.guardiana = new Guardiana(
                    this,
                    x,
                    y,
                    (mx, my, ancho, alto) =>
                        this.muros.getTilesWithinWorldXY(mx, my, ancho, alto, { isNotEmpty: true }).length > 0
                );
            } else if (nombre in ENEMIGOS) {
                this.enemigos.push(new Enemigo(this, x, y, nombre, ENEMIGOS[nombre]));
            } else if ((nombre === 'pocion' || nombre in OBJETOS) && !this.partida.recogidos.includes(suClave)) {
                this.recogibles.add(new Recogible(this, x, y, nombre, suClave));
            }
        }

        //  Se aparece junto al último brasero encendido de este nivel, o en el inicio
        const brasero = this.braseros.find((b) => b.clave === this.partida.brasero);
        const aparicion = brasero ? { x: brasero.x, y: brasero.y + SEPARACION_BRASERO } : inicio;
        this.jugador = new Farolero(this, aparicion.x, aparicion.y, this.partida);
        this.grupoEnemigos = this.add.group(this.enemigos);
    }

    private crearColisiones() {
        const solidos = [this.muros, ...this.braseros];

        this.physics.add.collider(this.jugador, solidos);
        this.physics.add.collider(this.grupoEnemigos, solidos);

        if (this.guardiana) {
            this.physics.add.collider(this.guardiana, solidos);
        }

        //  Ojo: en un choque entre un grupo y un objeto suelto, Phaser no siempre pasa los
        //  dos en el orden en que se escriben. Por eso cada respuesta busca su objeto por
        //  clase con `deClase` en vez de fiarse de la posición.

        //  La Lanza se apaga al chocar con un muro o un brasero, y daña al primer enemigo que toca
        this.physics.add.collider(this.lanzas, solidos, (a, b) => deClase(Lanza, a, b)?.apagar());
        this.physics.add.overlap(this.lanzas, this.grupoEnemigos, (a, b) =>
            this.lanzaAlcanza(deClase(Lanza, a, b), deClase(Enemigo, a, b))
        );

        if (this.guardiana) {
            this.physics.add.overlap(this.lanzas, this.guardiana, (a, b) =>
                this.lanzaAlcanza(deClase(Lanza, a, b), deClase(Guardiana, a, b))
            );
        }

        //  Las flechas se rompen contra muros y braseros, y hieren al farolero
        this.physics.add.collider(this.flechas, solidos, (a, b) => deClase(Flecha, a, b)?.destroy());
        this.physics.add.overlap(this.jugador, this.flechas, (a, b) => this.flechaAlcanza(deClase(Flecha, a, b)));

        this.physics.add.overlap(this.jugador, this.recogibles, (a, b) => this.recoger(deClase(Recogible, a, b)));
    }

    private crearCamara() {
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

    private crearControles() {
        const teclado = this.input.keyboard;

        if (!teclado) {
            throw new Error('No hay teclado disponible');
        }

        //  Atacar: J o Espacio. Esquivar: K o Mayúsculas. Lanza de Luz: L.
        //  Encender brasero: E. Poción: Q. Pausa: Esc o P.
        this.teclas = {
            flechas: teclado.createCursorKeys(),
            arriba: teclado.addKey('W'),
            abajo: teclado.addKey('S'),
            izquierda: teclado.addKey('A'),
            derecha: teclado.addKey('D'),
            atacar: [teclado.addKey('J'), teclado.addKey('SPACE')],
            esquivar: [teclado.addKey('K'), teclado.addKey('SHIFT')],
            lanzar: [teclado.addKey('L')],
            encender: [teclado.addKey('E')],
            beber: [teclado.addKey('Q')]
        };

        const pausar = () => {
            if (!this.terminando) {
                this.scene.pause();
                this.scene.launch('Pausa');
            }
        };
        teclado.addKey('ESC').on('down', pausar);
        teclado.addKey('P').on('down', pausar);

        //  F2 muestra u oculta las cajas de colisión (ayuda de desarrollo)
        teclado.addKey('F2').on('down', () => this.alternarDebugFisicas());
    }

    //  Traduce el teclado a la entrada que entiende el farolero
    private leerEntrada() {
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
            esquivar: recienPulsada(t.esquivar),
            lanzar: recienPulsada(t.lanzar),
            encender: recienPulsada(t.encender),
            beber: recienPulsada(t.beber)
        };
    }

    // ── Combate ──────────────────────────────────────────────────────────

    private empezarGolpe(golpe: Golpe) {
        this.golpeEnCurso = golpe;
        this.alcanzados.clear();

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

    //  Mientras dura el golpe, cada enemigo dentro de la zona recibe daño una sola vez
    private comprobarGolpeDelJugador(ahora: number) {
        const golpe = this.golpeEnCurso;

        if (!golpe || !this.jugador.combo.golpeActivo(ahora)) {
            this.golpeEnCurso = null;
            return;
        }

        const zona = this.jugador.zonaDeGolpe();
        const centro = this.jugador.body.center;
        const objetivos: (Enemigo | Guardiana)[] = [...this.enemigos];

        if (this.guardiana?.active) {
            objetivos.push(this.guardiana);
        }

        for (const objetivo of objetivos) {
            if (!objetivo.active || this.alcanzados.has(objetivo)) {
                continue;
            }

            const cuerpo = objetivo.body;
            const caja = new Geom.Rectangle(cuerpo.x, cuerpo.y, cuerpo.width, cuerpo.height);

            if (!cuerpo.enable || !Geom.Intersects.RectangleToRectangle(zona, caja)) {
                continue;
            }

            this.alcanzados.add(objetivo);
            const dano =
                objetivo instanceof Guardiana
                    ? objetivo.recibirGolpe(this.jugador.luchador, golpe.multiplicador, ahora)
                    : objetivo.recibirGolpe(this.jugador.luchador, golpe.multiplicador, ahora, centro.x, centro.y);

            //  Cada golpe que hace daño devuelve un poco de Luz
            if (dano > 0) {
                this.jugador.luz.ganar(LUZ_POR_GOLPE);
                this.comprobarDerrota(objetivo);
            }
        }
    }

    private crearLanza() {
        const mirando = this.jugador.mirando;
        const v = VECTORES[mirando];
        const centro = this.jugador.body.center;
        this.lanzas.add(new Lanza(this, centro.x + v.x * 10, centro.y + v.y * 10 - 4, mirando));
    }

    //  La Lanza daña con la fórmula de siempre y se apaga (no atraviesa)
    private lanzaAlcanza(lanza: Lanza | null, objetivo: Enemigo | Guardiana | null) {
        if (!lanza?.active || !objetivo?.active) {
            return;
        }

        const ahora = this.time.now;
        const dano =
            objetivo instanceof Guardiana
                ? objetivo.recibirGolpe(this.jugador.luchador, MULTIPLICADOR_LANZA, ahora)
                : objetivo.recibirGolpe(this.jugador.luchador, MULTIPLICADOR_LANZA, ahora, lanza.x, lanza.y);

        //  Contra la Guardiana en el aire la Lanza la atraviesa sin hacer nada
        if (dano > 0 || !(objetivo instanceof Guardiana)) {
            lanza.apagar();
        }

        if (dano > 0) {
            this.comprobarDerrota(objetivo);
        }
    }

    private flechaAlcanza(flecha: Flecha | null) {
        if (!flecha?.active) {
            return;
        }

        const ahora = this.time.now;

        if (this.jugador.esVulnerable(ahora)) {
            this.jugador.recibirGolpe(flecha.tirador, ahora, flecha.x, flecha.y, flecha.multiplicador);
            flecha.destroy();
        }
    }

    //  Si el golpe ha acabado con el enemigo: experiencia, recuento y, con el jefe, victoria
    private comprobarDerrota(objetivo: Enemigo | Guardiana) {
        if (objetivo.luchador.vivo) {
            return;
        }

        this.partida.estadisticas.enemigosVencidos++;
        const experiencia = objetivo instanceof Guardiana ? EXPERIENCIA_GUARDIANA : objetivo.datos.experiencia;
        const subidos = this.jugador.ganarExperiencia(experiencia);

        if (subidos > 0) {
            this.hud()?.mensaje(`¡Nivel ${this.jugador.experiencia.nivel}! Más vida, ataque y defensa`);
        }

        if (objetivo instanceof Guardiana) {
            this.ganar();
        }
    }

    private actualizarProyectiles() {
        //  Se recorre una copia: un proyectil que desaparece sale del grupo a mitad del recorrido
        for (const lanza of [...this.lanzas.getChildren()]) {
            (lanza as Lanza).actualizar();
        }

        for (const flecha of [...this.flechas.getChildren()]) {
            (flecha as Flecha).actualizar();
        }
    }

    private actualizarEnemigos(ahora: number) {
        const objetivo = this.jugador.body.center;
        this.enemigos = this.enemigos.filter((enemigo) => enemigo.active);

        for (const enemigo of this.enemigos) {
            const disparo = enemigo.actualizar(ahora, objetivo.x, objetivo.y);

            if (disparo && enemigo.datos.comportamiento === 'distancia') {
                const { velocidad, alcance, multiplicador } = enemigo.datos.flecha;
                this.flechas.add(
                    new Flecha(
                        this,
                        disparo.x,
                        disparo.y,
                        disparo.dx,
                        disparo.dy,
                        enemigo.luchador,
                        multiplicador,
                        velocidad,
                        alcance
                    )
                );
            }

            //  Un enemigo cuerpo a cuerpo que embiste y toca al farolero le hace daño
            if (enemigo.ia.haceDano && this.jugador.esVulnerable(ahora) && this.seTocan(enemigo.body)) {
                this.jugador.recibirGolpe(enemigo.luchador, ahora, enemigo.body.center.x, enemigo.body.center.y);
            }
        }
    }

    private actualizarGuardiana(ahora: number) {
        const guardiana = this.guardiana;

        if (!guardiana?.active || !guardiana.luchador.vivo) {
            return;
        }

        const pies = this.jugador.body.center;
        const faseAntes = guardiana.ia.fase;
        const { golpe, apagar } = guardiana.actualizar(ahora, pies.x, pies.y);

        if (guardiana.ia.fase === 2 && faseAntes === 1) {
            this.hud()?.mensaje('¡La Guardiana se enfurece!');
        }

        if (golpe?.alcanza(pies.x, pies.y)) {
            const origen = guardiana.pies;
            this.jugador.recibirGolpe(guardiana.luchador, ahora, origen.x, origen.y, golpe.multiplicador);
        }

        //  Fase 2: apaga todos los braseros de la sala. Reencenderlos la aturde.
        if (apagar) {
            for (const brasero of this.braseros) {
                brasero.apagar();
            }
            this.cameras.main.flash(250, 20, 0, 30);
            this.hud()?.mensaje('¡Ha apagado los braseros! Enciende uno (E) para aturdirla');
        }
    }

    private seTocan(cuerpo: Phaser.Physics.Arcade.Body): boolean {
        const j = this.jugador.body;
        return Geom.Intersects.RectangleToRectangle(
            new Geom.Rectangle(j.x, j.y, j.width, j.height),
            new Geom.Rectangle(cuerpo.x, cuerpo.y, cuerpo.width, cuerpo.height)
        );
    }

    // ── Braseros, Luz, objetos ───────────────────────────────────────────

    //  El brasero apagado más cercano, si está al alcance para encenderlo
    private braseroApagadoCercano(): Brasero | null {
        const { x, y } = this.jugador.body.center;
        let mejor: Brasero | null = null;

        for (const brasero of this.braseros) {
            const distancia = brasero.distanciaA(x, y);

            if (!brasero.encendido && distancia <= ALCANCE_ENCENDER && (!mejor || distancia < mejor.distanciaA(x, y))) {
                mejor = brasero;
            }
        }

        return mejor;
    }

    private encenderBraseroCercano(ahora: number) {
        const { x, y } = this.jugador.body.center;
        const brasero = this.braseroApagadoCercano();

        if (!brasero?.encender(x, y, this.jugador.luz)) {
            return;
        }

        const partida = this.partida;
        if (!partida.braseros.includes(brasero.clave)) {
            partida.braseros.push(brasero.clave);
        }

        //  En plena pelea con la Guardiana no se guarda: encender la aturde (fase 2)
        const guardiana = this.guardiana;
        if (guardiana?.luchador.vivo && guardiana.ia.estado !== 'dormida') {
            if (guardiana.ia.braseroEncendido(ahora)) {
                this.hud()?.mensaje('¡La luz aturde a la Guardiana!');
            }
            return;
        }

        partida.brasero = brasero.clave;
        this.jugador.volcarEn(partida);
        const guardado = guardar(copiarPartida(partida));
        this.hud()?.mensaje(
            guardado ? 'Brasero encendido · Partida guardada' : 'Brasero encendido (no se ha podido guardar)'
        );
    }

    private beberPocion() {
        const curado = this.jugador.pociones.beber(this.jugador.luchador);

        if (curado > 0) {
            this.hud()?.mensaje(`+${curado} PV`);
        } else if (this.jugador.pociones.cantidad === 0) {
            this.hud()?.mensaje('No te quedan pociones');
        }
    }

    private recoger(recogible: Recogible | null) {
        if (!recogible?.active) {
            return;
        }

        if (recogible.tipo === 'pocion') {
            if (!this.jugador.pociones.recoger()) {
                return;
            }
            this.hud()?.mensaje('Poción (Q para beber)');
        } else {
            const objeto = objetoPorId(recogible.tipo);

            if (!objeto) {
                return;
            }

            if (this.jugador.equipo.recoger(objeto)) {
                this.jugador.recalcularEstadisticas();
                const mejora = objeto.atq > 0 ? `ATQ +${objeto.atq}` : `DEF +${objeto.def}`;
                this.hud()?.mensaje(`${objeto.nombre} equipado (${mejora})`);
            } else {
                this.hud()?.mensaje(`${objeto.nombre}: ya llevas algo mejor`);
            }
        }

        this.partida.recogidos.push(recogible.clave);
        recogible.destroy();
    }

    //  La Luz se gasta con el tiempo o se recarga junto a un brasero encendido.
    //  Sin Luz, el frío quita PV.
    private actualizarLuz(delta: number) {
        const { x, y } = this.jugador.body.center;
        const junto = this.braseros.some((brasero) => brasero.reglas.recargaA(brasero.distanciaA(x, y)));
        const frio = this.jugador.luz.actualizar(delta, junto);

        if (frio > 0) {
            this.jugador.luchador.perderPv(frio);
        }
    }

    private actualizarOscuridad() {
        const focos = [{ x: this.jugador.x, y: this.jugador.y, radio: this.jugador.luz.radio }];

        for (const brasero of this.braseros) {
            if (brasero.encendido) {
                //  Un leve parpadeo para que parezca fuego
                const parpadeo = Math.sin(this.time.now / 90 + brasero.x) * 3;
                focos.push({ x: brasero.x, y: brasero.y, radio: RADIO_LUZ_BRASERO + parpadeo });
            }
        }

        //  La Lanza de Luz alumbra un poco a su paso
        for (const lanza of this.lanzas.getChildren() as Lanza[]) {
            focos.push({ x: lanza.x, y: lanza.y, radio: 28 });
        }

        this.oscuridad.dibujar(focos);
    }

    private hud(): Hud | null {
        const hud = this.scene.get('Hud') as Hud;

        //  La escena del HUD arranca un fotograma después que esta
        return hud.sys.isActive() ? hud : null;
    }

    private actualizarHud() {
        const hud = this.hud();

        if (!hud) {
            return;
        }

        const { luchador, luz, experiencia, pociones, equipo } = this.jugador;
        let aviso: string | null = null;

        if (this.braseroApagadoCercano()) {
            aviso = 'E: encender el brasero';
        } else if (luz.valor === 0) {
            aviso = 'Sin Luz, el frío te hiere. Busca un brasero';
        }

        const guardiana = this.guardiana;

        hud.mostrar({
            pv: luchador.pv,
            pvMax: luchador.pvMax,
            luz: luz.valor,
            nivel: experiencia.nivel,
            experiencia: experiencia.total,
            siguienteNivel: experiencia.siguienteNivel,
            pociones: pociones.cantidad,
            equipo: [equipo.arma?.nombre, equipo.talisman?.nombre].filter((n): n is string => Boolean(n)),
            aviso,
            jefe:
                guardiana?.active && guardiana.ia.estado !== 'dormida'
                    ? { nombre: 'La Guardiana del Pozo', proporcion: guardiana.proporcionPv }
                    : null
        });
    }

    // ── Final del nivel: salida, muerte, victoria ────────────────────────

    private comprobarSalida() {
        if (!this.salida) {
            return;
        }

        const { x, y } = this.jugador.body.center;

        if (!this.salida.contains(x, y)) {
            return;
        }

        const indice = NIVELES.findIndex((n) => n.id === this.nivel.id);
        const siguiente = NIVELES[indice + 1];

        if (!siguiente) {
            return;
        }

        this.terminando = true;
        this.jugador.setVelocity(0, 0);
        this.jugador.volcarEn(this.partida);
        cambiarDeNivel(this.partida, siguiente.id);
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
    }

    private morir() {
        if (this.terminando) {
            return;
        }

        this.terminando = true;
        this.jugador.setVelocity(0, 0);
        this.jugador.setTint(0x404040);

        //  Se vuelve a lo guardado en el último brasero, pero la muerte y el tiempo cuentan
        const guardada = cargar() ?? partidaNueva(NIVELES[0].id);
        const siguiente = trasMorir(guardada, this.partida);
        guardar(siguiente);
        this.registry.set('partida', siguiente);

        this.time.delayedCall(700, () => this.scene.start('GameOver'));
    }

    private ganar() {
        this.terminando = true;
        this.jugador.setVelocity(0, 0);
        this.jugador.volcarEn(this.partida);
        const estadisticas = { ...this.partida.estadisticas, nivel: this.jugador.experiencia.nivel };

        //  Partida terminada: se borra el guardado (la próxima vez, partida nueva)
        borrar();
        this.registry.remove('partida');

        //  Todos los braseros se encienden solos: la sala se ilumina
        for (const brasero of this.braseros) {
            brasero.restaurar();
        }

        this.time.delayedCall(2500, () => {
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Victoria', estadisticas));
        });
    }

    private alternarDebugFisicas() {
        const mundo = this.physics.world;

        //  Con debug: false en la configuración, la capa de depuración aún no existe
        const mostrar = !(mundo.debugGraphic?.visible && mundo.drawDebug);

        if (!mundo.debugGraphic) {
            mundo.createDebugGraphic();
        }

        mundo.drawDebug = mostrar;
        mundo.debugGraphic.clear();
        mundo.debugGraphic.setVisible(mundo.drawDebug);
    }
}
