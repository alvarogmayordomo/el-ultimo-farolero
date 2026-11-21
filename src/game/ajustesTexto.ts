import { GameObjects } from 'phaser';

//  La fuente del pack (normal.ttf) trae un espacio muy estrecho y las palabras se juntan.
//  Phaser no tiene opción de espacio entre palabras, pero el canvas del navegador sí
//  (`wordSpacing`). Phaser llama a TextStyle.syncFont cada vez que prepara el canvas de
//  un texto (también tras redimensionarlo, que borra los ajustes del canvas), así que
//  se añade ahí. Afecta a todos los textos del juego sin tocar cada `add.text`.
const ESPACIO_ENTRE_PALABRAS = '0.4em';

const sincronizar = GameObjects.TextStyle.prototype.syncFont;

GameObjects.TextStyle.prototype.syncFont = function (
    this: GameObjects.TextStyle,
    canvas: HTMLCanvasElement,
    contexto: CanvasRenderingContext2D
) {
    sincronizar.call(this, canvas, contexto);

    const conEspaciado = contexto as CanvasRenderingContext2D & { wordSpacing?: string };
    if ('wordSpacing' in conEspaciado) {
        conEspaciado.wordSpacing = ESPACIO_ENTRE_PALABRAS;
    }
};
