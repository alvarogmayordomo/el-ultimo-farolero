//  Daño de un golpe. Siempre con la misma fórmula (docs/plan.md):
//  ATQ × multiplicador × 100 / (100 + DEF), redondeado y como mínimo 1
export function calcularDano (atq: number, multiplicador: number, def: number): number
{
    const dano = atq * multiplicador * 100 / (100 + def);

    return Math.max(1, Math.round(dano));
}
