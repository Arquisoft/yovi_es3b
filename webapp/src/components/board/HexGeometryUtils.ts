export const HEX_SIZE = 26;

// Convertimos de cordenadas haxagonales axiales (q, r) a píxeles para SVG
export function hexToPixel(q: number, r: number): { x: number; y: number } {
    return {
        x: HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r),
        y: HEX_SIZE * (3 / 2) * r,
    };
}

// Calculamos los vértices de un hexágono (casillas) dado el centro (cx, cy)
// Devuelve un string de puntos (vertices)
export function hexCorners(cx: number, cy: number): string {
    return Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 180) * (60 * i - 30);
        return `${cx + HEX_SIZE * Math.cos(angle)},${cy + HEX_SIZE * Math.sin(angle)}`;
    }).join(" ");
}

/** Generates all cells of an n-side triangular board as (q, r) pairs. */
export function generateBoard(size: number): { q: number; r: number }[] {
    const cells: { q: number; r: number }[] = [];
    for (let q = 0; q < size; q++) {
        for (let r = 0; r < size - q; r++) {
            cells.push({ q, r });
        }
    }
    return cells;
}

/**
 * Retorna un array que indica a que lado pertenece la celda
 * Si una de las coordenadas (q,r,z) es 0 está en el borde
 * Puede retornar [] si no toca ningún lado, [X] si toca el lado
 * x o [X,Y] si es una esquina y toca el lado x e y
 */
export function getSides(q: number, r: number, size: number): number[] {
    const z = size - 1 - q - r;
    const sides: number[] = [];
    if (q === 0) sides.push(0);
    if (r === 0) sides.push(1);
    if (z === 0) sides.push(2);
    return sides;
}

/**
 * Calcula el atributo `viewBox` del SVG, que le dice al navegador qué región del espacio de coordenadas debe mostrar.
 * Recibe una lista con las posiciones en píxeles del centro de cada celda, ya calculadas por `hexToPixel`.
 *
 * Encuentra los extremos del tablero buscando el mínimo y máximo de `x` e `y` entre todas las celdas.
 * A eso le suma `HEX_SIZE` en cada dirección para que las celdas de los bordes no queden cortadas
 * (los centros están dentro del tablero pero sus vértices sobresalen `HEX_SIZE` píxeles),
 * y encima añade `padding` para dejar un margen visual alrededor.
 *
 * Devuelve una cadena con el formato que espera SVG: `"minX minY width height"`, que define la esquina superior
 * izquierda del área visible y sus dimensiones. Ej. "-50 -50 600 520"
 */
export function computeViewBox(
    positions: { x: number; y: number }[],
    padding = 24
): string {
    const xs = positions.map((p) => p.x);
    const ys = positions.map((p) => p.y);
    const minX = Math.min(...xs) - HEX_SIZE - padding;
    const minY = Math.min(...ys) - HEX_SIZE - padding;
    const width = Math.max(...xs) - Math.min(...xs) + HEX_SIZE * 2 + padding * 2;
    const height = Math.max(...ys) - Math.min(...ys) + HEX_SIZE * 2 + padding * 2;
    return `${minX} ${minY} ${width} ${height}`;
}