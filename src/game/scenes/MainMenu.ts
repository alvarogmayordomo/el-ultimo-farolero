import { Scene } from 'phaser';
import { copiarPartida, partidaNueva } from '../../core/partida';
import { NIVELES } from '../../data/datos';
import { cargar, guardar } from '../../platform/guardado';
import { COLORES, estiloTexto } from '../estilo';
import { crearMenu, type OpcionMenu } from '../Menu';

//  Pantalla de título: Continuar (si hay partida guardada), Nueva partida y Créditos
export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(COLORES.fondo);

        //  Un farolero quieto junto a un brasero encendido, en medio de la oscuridad
        const resplandor = this.add.circle(width / 2, height / 2 - 18, 70, 0xffc94d, 0.08);
        this.tweens.add({ targets: resplandor, scale: 1.08, alpha: 0.12, duration: 900, yoyo: true, repeat: -1 });
        this.add
            .sprite(width / 2 - 14, height / 2 - 14, 'farolero-quieto', 0)
            .setScale(2)
            .play('quieto-abajo');
        this.add.image(width / 2 + 18, height / 2 - 6, 'mazmorra', 26).setScale(2);
        this.add
            .sprite(width / 2 + 18, height / 2 - 24, 'fx-fuego', 3)
            .setScale(2)
            .play('fx-fuego');

        this.add.text(width / 2, 52, 'El Último Farolero', estiloTexto(30, COLORES.luz)).setOrigin(0.5);
        this.add
            .text(
                width / 2,
                82,
                'La Penumbra se ha tragado el reino. Enciende los braseros.',
                estiloTexto(10, COLORES.apagado)
            )
            .setOrigin(0.5);

        const guardada = cargar();
        const opciones: OpcionMenu[] = [];

        if (guardada) {
            opciones.push({ texto: 'Continuar', accion: () => this.empezar(guardada) });
        }

        opciones.push(
            {
                texto: 'Nueva partida',
                accion: () => {
                    //  Una sola partida: la nueva sustituye a la guardada
                    const nueva = partidaNueva(NIVELES[0].id);
                    guardar(copiarPartida(nueva));
                    this.empezar(nueva);
                }
            },
            { texto: 'Créditos', accion: () => this.scene.start('Creditos') }
        );

        crearMenu(this, width / 2, height / 2 + 60, opciones);

        this.add
            .text(
                width / 2,
                height - 14,
                'Flechas o WASD para elegir · Enter para aceptar',
                estiloTexto(8, COLORES.apagado)
            )
            .setOrigin(0.5);
    }

    private empezar(partida: ReturnType<typeof partidaNueva>) {
        this.registry.set('partida', partida);
        this.input.keyboard?.removeAllListeners();
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game'));
    }
}
