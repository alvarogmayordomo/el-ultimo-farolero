import { Scene } from 'phaser';
import { COSTE_LANZA } from '../../core/lanza';
import { LUZ_MAX } from '../../core/luz';
import { MAX_POCIONES } from '../../core/pociones';
import { COLORES, estiloTexto } from '../estilo';

//  Datos que el HUD necesita de la partida. Game se los pasa cada fotograma.
export interface EstadoHud {
    pv: number;
    pvMax: number;
    luz: number;
    nivel: number;
    experiencia: number;
    //  Experiencia total para el siguiente nivel, o null en el máximo
    siguienteNivel: number | null;
    pociones: number;
    //  Nombres de lo equipado
    equipo: string[];
    //  Texto de ayuda contextual («E: encender brasero»), o null
    aviso: string | null;
    //  Barra del jefe, si está peleando
    jefe: { nombre: string; proporcion: number } | null;
}

const ANCHO_BARRA = 140;
const ALTO_BARRA = 8;
const X = 12;

//  HUD a 640×360 (sin el zoom de la cámara del juego), en una escena aparte
//  que se dibuja encima de Game. Solo pinta: no decide nada.
export class Hud extends Scene {
    private barras: Phaser.GameObjects.Graphics;
    private textoPv: Phaser.GameObjects.Text;
    private textoLuz: Phaser.GameObjects.Text;
    private textoNivel: Phaser.GameObjects.Text;
    private textoPociones: Phaser.GameObjects.Text;
    private textoEquipo: Phaser.GameObjects.Text;
    private aviso: Phaser.GameObjects.Text;
    private textoJefe: Phaser.GameObjects.Text;
    private mensajes: Phaser.GameObjects.Text[] = [];

    constructor() {
        super('Hud');
    }

    create() {
        this.mensajes = [];
        const derecha = X + ANCHO_BARRA + 6;

        this.barras = this.add.graphics();
        this.textoPv = this.add.text(derecha, 7, '', estiloTexto(10));
        this.textoLuz = this.add.text(derecha, 21, '', estiloTexto(10, COLORES.luz));
        this.textoNivel = this.add.text(derecha, 35, '', estiloTexto(10));

        this.add.image(X + 4, 54, 'objeto-pocion').setScale(1.2);
        this.textoPociones = this.add.text(X + 12, 47, '', estiloTexto(10));
        this.textoEquipo = this.add.text(X + 48, 47, '', estiloTexto(10, COLORES.apagado));

        this.aviso = this.add.text(this.scale.width / 2, this.scale.height - 36, '', estiloTexto(12, '#ffe6a8'));
        this.aviso.setOrigin(0.5);

        this.textoJefe = this.add.text(this.scale.width / 2, this.scale.height - 62, '', estiloTexto(11));
        this.textoJefe.setOrigin(0.5);

        this.add
            .text(
                this.scale.width - 8,
                this.scale.height - 6,
                'J atacar · K esquivar · L Lanza · E encender · Q poción · Esc pausa',
                estiloTexto(8, COLORES.apagado)
            )
            .setOrigin(1, 1);
    }

    mostrar(estado: EstadoHud) {
        const g = this.barras;
        g.clear();

        this.dibujarBarra(X, 10, ANCHO_BARRA, estado.pv / estado.pvMax, 0xd04848);
        this.dibujarBarra(X, 24, ANCHO_BARRA, estado.luz / LUZ_MAX, 0xffc94d);

        //  Marca en la barra de Luz: por debajo no hay bastante para la Lanza
        g.fillStyle(0xffffff, 0.6);
        g.fillRect(X + (ANCHO_BARRA * COSTE_LANZA) / LUZ_MAX, 24, 1, ALTO_BARRA);

        //  Barra fina de experiencia hacia el siguiente nivel
        const progreso = estado.siguienteNivel === null ? 1 : estado.experiencia / estado.siguienteNivel;
        this.dibujarBarra(X, 38, ANCHO_BARRA, progreso, 0x8ad4ff, 4);

        this.textoPv.setText(`PV ${Math.ceil(estado.pv)}/${estado.pvMax}`);
        this.textoLuz.setText(`Luz ${Math.floor(estado.luz)}`);
        this.textoNivel.setText(
            estado.siguienteNivel === null
                ? `Nv ${estado.nivel} (máx.)`
                : `Nv ${estado.nivel} · ${estado.experiencia}/${estado.siguienteNivel}`
        );
        this.textoPociones.setText(`${estado.pociones}/${MAX_POCIONES}`);
        this.textoEquipo.setText(estado.equipo.join(' · '));
        this.aviso.setText(estado.aviso ?? '');

        if (estado.jefe) {
            const ancho = 300;
            this.dibujarBarra(
                (this.scale.width - ancho) / 2,
                this.scale.height - 54,
                ancho,
                estado.jefe.proporcion,
                0xb04a7a
            );
            this.textoJefe.setText(estado.jefe.nombre);
        } else {
            this.textoJefe.setText('');
        }
    }

    //  Mensaje que aparece arriba en el centro unos segundos (objetos, niveles, guardado…)
    mensaje(texto: string) {
        //  Como mucho 3 a la vez: el más antiguo se va para dejar sitio
        if (this.mensajes.length >= 3) {
            this.mensajes.shift()?.destroy();
            this.mensajes.forEach((m, i) => {
                m.setY(70 + i * 16);
            });
        }

        const y = 70 + this.mensajes.length * 16;
        const aviso = this.add.text(this.scale.width / 2, y, texto, estiloTexto(11, '#ffe6a8')).setOrigin(0.5);
        this.mensajes.push(aviso);

        this.tweens.add({
            targets: aviso,
            alpha: 0,
            delay: 2200,
            duration: 500,
            onComplete: () => {
                this.mensajes = this.mensajes.filter((m) => m !== aviso);
                aviso.destroy();
            }
        });
    }

    //  Nombre del nivel, grande, al entrar
    anunciar(nombre: string) {
        const titulo = this.add
            .text(this.scale.width / 2, this.scale.height / 2 - 40, nombre, estiloTexto(22, COLORES.luz))
            .setOrigin(0.5)
            .setAlpha(0);

        this.tweens.chain({
            targets: titulo,
            tweens: [
                { alpha: 1, duration: 500 },
                { alpha: 0, delay: 1600, duration: 700 }
            ],
            onComplete: () => titulo.destroy()
        });
    }

    private dibujarBarra(x: number, y: number, ancho: number, proporcion: number, color: number, alto = ALTO_BARRA) {
        const g = this.barras;
        const lleno = Math.max(0, Math.min(1, proporcion));

        g.fillStyle(0x000000, 0.7);
        g.fillRect(x - 1, y - 1, ancho + 2, alto + 2);
        g.fillStyle(color, 1);
        g.fillRect(x, y, Math.round(ancho * lleno), alto);
    }
}
