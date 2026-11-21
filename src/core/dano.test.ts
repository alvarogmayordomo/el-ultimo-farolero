import { describe, expect, it } from 'vitest';
import { calcularDano } from './dano';

describe('calcularDano', () => {
    it('aplica la fórmula ATQ × multiplicador × 100 / (100 + DEF)', () => {
        //  10 × 1 × 100 / (100 + 0) = 10
        expect(calcularDano(10, 1, 0)).toBe(10);
        //  20 × 1.5 × 100 / (100 + 50) = 20
        expect(calcularDano(20, 1.5, 50)).toBe(20);
    });

    it('redondea al entero más cercano', () => {
        //  10 × 1 × 100 / (100 + 5) = 9.52… → 10
        expect(calcularDano(10, 1, 5)).toBe(10);
        //  10 × 1 × 100 / (100 + 30) = 7.69… → 8
        expect(calcularDano(10, 1, 30)).toBe(8);
    });

    it('siempre quita al menos 1 punto', () => {
        expect(calcularDano(1, 1, 1000)).toBe(1);
    });
});
