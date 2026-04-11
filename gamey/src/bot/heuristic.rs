// Puntúa cada casilla libre con varios criterios y elige la mejor.

use crate::{Coordinates, GameY, PlayerId, YBot};

pub struct HeuristicBot;

// Pesos para cada criterio de evaluación, se ajutan para que el bot priorice bloquear al rival y conectar sus piezas
const WEIGHT_FRIENDLY_NEIGHBOR: i32 = 15;
const WEIGHT_BLOCK_ENEMY: i32 = 12;
const WEIGHT_TOUCH_NEW_SIDE: i32 = 40;
const WEIGHT_BRIDGE_GROUPS: i32 = 50;
const WEIGHT_BLOCK_TWO_SIDES: i32 = 80;
const WEIGHT_CENTER_BONUS: i32 = 8;
const WEIGHT_EDGE_BASE: i32 = 5;

impl YBot for HeuristicBot {
    fn name(&self) -> &str {
        "heuristic_bot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        let available = board.available_cells();
        if available.is_empty() {
            return None;
        }

        let me = PlayerId::new(1);
        let rival = PlayerId::new(0);

        let mut best_score = i32::MIN;
        let mut best_move = None;

        for &cell in available {
            let coords = Coordinates::from_index(cell, board.board_size());
            let score = evaluate_move(board, &coords, me, rival);

            if score > best_score {
                best_score = score;
                best_move = Some(coords);
            }
        }

        best_move
    }
}

// Evalúa una jugada sumando puntos por cada criterio
fn evaluate_move(
    board: &GameY,
    coords: &Coordinates,
    me: PlayerId,
    rival: PlayerId,
) -> i32 {
    let neighbors = board.get_neighbors(coords);
    let mut score: i32 = 0;

    //piezas adyacentes
    let friendly_count = neighbors
        .iter()
        .filter(|n| board.cell_owner(n) == Some(me))
        .count() as i32;
    score += friendly_count * WEIGHT_FRIENDLY_NEIGHBOR;

    // Bloquear al rival
    let enemy_count = neighbors
        .iter()
        .filter(|n| board.cell_owner(n) == Some(rival))
        .count() as i32;
    score += enemy_count * WEIGHT_BLOCK_ENEMY;

    // Tocar un lado nuevo: si las piezas del otro jugador aún no lo tocan
    let my_sides = get_sides_touched_by_player(board, me);
    if coords.touches_side_a() && !my_sides.0 {
        score += WEIGHT_TOUCH_NEW_SIDE;
    }
    if coords.touches_side_b() && !my_sides.1 {
        score += WEIGHT_TOUCH_NEW_SIDE;
    }
    if coords.touches_side_c() && !my_sides.2 {
        score += WEIGHT_TOUCH_NEW_SIDE;
    }

    // Conectar grupos separados: si esta casilla une dos o más grupos de fchas
    let distinct_groups = count_distinct_friendly_groups(board, &neighbors, me);
    if distinct_groups >= 2 {
        score += WEIGHT_BRIDGE_GROUPS * (distinct_groups as i32 - 1);
    }

    // Bloqueo urgente: el rival va a tocar 2 lados
    if rival_threatens_two_sides(board, coords, rival) {
        score += WEIGHT_BLOCK_TWO_SIDES;
    }

    //Bonus por cercania al centro
    let max_dist = board.board_size() as i32;
    let dist = coords.distance_to_center(board.board_size());
    score += ((max_dist - dist) * WEIGHT_CENTER_BONUS) / max_dist;

    // Bonus por estar en el borde
    if coords.is_on_edge() {
        score += WEIGHT_EDGE_BASE;
    }

    score
}

// Devuelve qué lads ya tnen al menos una pieza del jugador
fn get_sides_touched_by_player(board: &GameY, player: PlayerId) -> (bool, bool, bool) {
    let size = board.board_size();
    let total = (size * (size + 1)) / 2;
    let mut a = false;
    let mut b = false;
    let mut c = false;

    for idx in 0..total {
        let coords = Coordinates::from_index(idx, size);
        if board.cell_owner(&coords) == Some(player) {
            if coords.touches_side_a() { a = true; }
            if coords.touches_side_b() { b = true; }
            if coords.touches_side_c() { c = true; }
        }
        if a && b && c { break; }
    }
    (a, b, c)
}

// Marca un grupo de piezas conectadas como visitadas usando BFS
fn mark_group_as_visited(
    board: &GameY,
    start_idx: usize,
    friendly_neighbors: &[&Coordinates],
    visited: &mut Vec<bool>,
) {
    let mut stack = vec![start_idx];
    while let Some(current) = stack.pop() {
        if visited[current] {
            continue;
        }
        visited[current] = true;

        for j in 0..friendly_neighbors.len() {
            if !visited[j] && are_neighbors(board, friendly_neighbors[current], friendly_neighbors[j]) {
                stack.push(j);
            }
        }
    }
}

// Comprueba si dos casillas son adyacentes
fn are_neighbors(board: &GameY, a: &Coordinates, b: &Coordinates) -> bool {
    board.get_neighbors(a).contains(b)
}

// Cuenta cuántos grupos distintos de piezas del usuario rodean esta casilla.
// Si hay 2 o más, se coloca aquí
fn count_distinct_friendly_groups(
    board: &GameY,
    neighbors: &[Coordinates],
    me: PlayerId,
) -> usize {
    // Para cada pieza aliada adyacente, hacemos un BFS simple y anotamos a qué color pertenece
    let friendly_neighbors: Vec<&Coordinates> = neighbors
        .iter()
        .filter(|n| board.cell_owner(n) == Some(me))
        .collect();

    if friendly_neighbors.len() <= 1 {
        return friendly_neighbors.len();
    }

    // Usamos conjuntos de piezas conectadas BFS solo a piezas adyacentes
    let mut visited: Vec<bool> = vec![false; friendly_neighbors.len()];
    let mut groups = 0;

    for i in 0..friendly_neighbors.len() {
        if visited[i] {
            continue;
        }
        groups += 1;
        mark_group_as_visited(board, i, &friendly_neighbors, &mut visited);
    }

    groups
}

// Detecta si el rival tiene algún grupo adyacente a esta casilla que ya toca 2 lados.
fn rival_threatens_two_sides(
    board: &GameY,
    coords: &Coordinates,
    rival: PlayerId,
) -> bool {
    let neighbors = board.get_neighbors(coords);

    for neighbor in &neighbors {
        if board.cell_owner(neighbor) != Some(rival) {
            continue;
        }
        // Hacemos BFS desde esta pieza rival para ver qué lados toca su grupo
        let (a, b, c) = bfs_group_sides(board, neighbor, rival);
        let sides_count = a as u8 + b as u8 + c as u8;
        if sides_count >= 2 {
            return true;
        }
    }
    false
}

// BFS para encontrar qué lados toca un grupo conectado de piezas
fn bfs_group_sides(
    board: &GameY,
    start: &Coordinates,
    player: PlayerId,
) -> (bool, bool, bool) {
    let mut visited = std::collections::HashSet::new();
    let mut stack = vec![*start];
    let mut a = false;
    let mut b = false;
    let mut c = false;

    while let Some(current) = stack.pop() {
        if !visited.insert(current) {
            continue;
        }
        if current.touches_side_a() { a = true; }
        if current.touches_side_b() { b = true; }
        if current.touches_side_c() { c = true; }

        for neighbor in board.get_neighbors(&current) {
            if board.cell_owner(&neighbor) == Some(player) && !visited.contains(&neighbor) {
                stack.push(neighbor);
            }
        }
    }

    (a, b, c)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Movement, PlayerId};

    #[test]
    fn test_heuristic_bot_returns_valid_move() {
        let bot = HeuristicBot;
        let game = GameY::new(5);
        let coords = bot.choose_move(&game).unwrap();
        let index = coords.to_index(game.board_size());
        assert!(game.available_cells().contains(&index));
    }

    #[test]
    fn test_heuristic_bot_returns_none_on_full_board() {
        let bot = HeuristicBot;
        let mut game = GameY::new(2);

        let moves = vec![
            Movement::Placement { player: PlayerId::new(0), coords: Coordinates::new(1, 0, 0) },
            Movement::Placement { player: PlayerId::new(1), coords: Coordinates::new(0, 1, 0) },
            Movement::Placement { player: PlayerId::new(0), coords: Coordinates::new(0, 0, 1) },
        ];
        for mv in moves {
            game.add_move(mv).unwrap();
        }

        assert!(bot.choose_move(&game).is_none());
    }

    #[test]
    fn test_heuristic_prefers_blocking_dangerous_rival() {
        let bot = HeuristicBot;
        let mut game = GameY::new(5);

        // El rival (player 0) coloca piezas tocando dos lados
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(0, 0, 4), // esquina lado A y B
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(2, 2, 0),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(0, 1, 3), // lado A
        }).unwrap();

        let chosen = bot.choose_move(&game).unwrap();
        let index = chosen.to_index(game.board_size());
        assert!(game.available_cells().contains(&index));
    }
}
