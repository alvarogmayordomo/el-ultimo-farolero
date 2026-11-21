import { BlendModes, type Scene } from 'phaser';
import { RADIO_MAX } from '../core/luz';

//  La textura «luz» se crea con el radio máximo y se escala según el radio que toque
const RADIO_TEXTURA = RADIO_MAX;

//  Margen de la capa alrededor de la vista: la cámara se coloca después de update(),
//  así que la capa va un fotograma por detrás y el margen evita que asome un borde.
const MARGEN = 32;

//  Una luz que hay que abrir en la oscuridad este fotograma
export interface FocoDeLuz {
    x: number;
    y: number;
    radio: number;
}

//  Capa de oscuridad (docs/plan.md): una textura negra que tapa la vista y en la que,
//  cada fotograma, se abre un círculo degradado en cada foco de luz.
export class Oscuridad {
    private capa: Phaser.GameObjects.RenderTexture;

    constructor(private readonly escena: Scene) {
        //  Textura «luz»: un círculo blanco que se desvanece hacia el borde. Al borrar
        //  con ella, la oscuridad desaparece del todo en el centro y poco a poco hacia fuera.
        if (!escena.textures.exists('luz')) {
            const lienzo = escena.textures.createCanvas('luz', RADIO_TEXTURA * 2, RADIO_TEXTURA * 2);

            if (!lienzo) {
                throw new Error('No se ha podido crear la textura de luz');
            }

            const ctx = lienzo.getContext();
            const r = RADIO_TEXTURA;
            const degradado = ctx.createRadialGradient(r, r, 0, r, r, r);
            degradado.addColorStop(0, 'rgba(255, 255, 255, 1)');
            degradado.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
            degradado.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = degradado;
            ctx.fillRect(0, 0, r * 2, r * 2);
            lienzo.refresh();
        }

        //  Capa negra del tamaño de la vista (320×180) más un margen, por encima de todo
        const camara = escena.cameras.main;
        this.capa = escena.add.renderTexture(
            0,
            0,
            camara.width / camara.zoom + MARGEN * 2,
            camara.height / camara.zoom + MARGEN * 2
        );
        this.capa.setOrigin(0, 0);
        this.capa.setDepth(1000);
    }

    //  Cada fotograma: se coloca la capa sobre la vista, se pinta de negro y se abren las luces
    dibujar(focos: FocoDeLuz[]) {
        const vista = this.escena.cameras.main.worldView;
        const x = Math.floor(vista.x) - MARGEN;
        const y = Math.floor(vista.y) - MARGEN;

        this.capa.setPosition(x, y);
        this.capa.fill(0x000000, 1);

        for (const foco of focos) {
            //  stamp coloca la textura por su centro; con el modo ERASE borra en vez de pintar
            this.capa.stamp('luz', undefined, foco.x - x, foco.y - y, {
                scale: foco.radio / RADIO_TEXTURA,
                blendMode: BlendModes.ERASE
            });
        }

        this.capa.render();
    }
}
