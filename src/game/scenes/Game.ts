import { Scene } from 'phaser';

export class Game extends Scene
{
    mapa: Phaser.Tilemaps.Tilemap;
    muros: Phaser.Tilemaps.TilemapLayer;

    constructor ()
    {
        super('Game');
    }

    create ()
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

        if (!capaMuros)
        {
            throw new Error('El mapa no tiene la capa «muros»');
        }

        this.muros = capaMuros;
    }
}
