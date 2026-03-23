// Simula varios turnos por delante y elige la mejor jugada

use crate::{Coordinates, GameY, GameStatus, Movement, PlayerId, YBot};
use std::collections::HashSet;

pub struct MinimaxBot;

// Profundidad según tamaño del tablero.
// En tableros grandes hay muchas casillas libres, así que bajamos la profundidad
// para que el tiempo de respuesta no se dispare.
fn max_depth_for_size(board_size: u32, occupied: u32) -> u32 {
    let free = (board_size * (board_size + 1)) / 2 - occupied;
    match free {
        0..=10 => 8,
        11..=25 => 6,
        26..=50 => 4,
        _ => 3,
    }
}

impl YBot for MinimaxBot {
    fn name(&self) -> &str {
        "minimax_bot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        let available = board.available_cells();
        if available.is_empty() {
            return None;
        }

        let me = PlayerId::new(1);
        let total = board.total_cells();
        let occupied = total - available.len() as u32;
        let depth = max_depth_for_size(board.board_size(), occupied);

        // Ordenamos las jugadas candidatas por el ehuristico para que la poda alfa-beta corte antes, es deicr siempre evaluamos primero las mejores jugadas
        let mut candidates: Vec<(i32, Coordinates)> = available
            .iter()
            .map(|&cell| {
                let coords = Coordinates::from_index(cell, board.board_size());
                let h = quick_heuristic(board, &coords, me);
                (h, coords)
            })
            .collect();
        candidates.sort_by(|a, b| b.0.cmp(&a.0));

        let mut best_score = i32::MIN;
        let mut best_move = None;
        let mut alpha = i32::MIN;
        let beta = i32::MAX;

        for (_, coords) in &candidates {
            // Simulamos nuestra jugada
            let mut clone = board.clone();
            let mv = Movement::Placement { player: me, coords: *coords };
            if clone.add_move(mv).is_err() {
                continue;
            }

            // Si ganamos, no hace falta seguir buscando
            if let GameStatus::Finished { winner } = clone.status() {
                if *winner == me {
                    return Some(*coords);
                }
            }

            // Turno del rival
            let score = minimax(&clone, depth - 1, alpha, beta, false, me);

            if score > best_score {
                best_score = score;
                best_move = Some(*coords);
            }
            alpha = alpha.max(score);
        }

        best_move
    }
}

// maximizing = true cuando es nuestro turno, mejor movimiento
// false cuando es turno del rival
fn minimax(
    board: &GameY,
    depth: u32,
    mut alpha: i32,
    mut beta: i32,
    maximizing: bool,
    me: PlayerId,
) -> i32 {
    // caso base: juego terminado o profundidad agotada
    if let GameStatus::Finished { winner } = board.status() {
        return if *winner == me { 10_000 } else { -10_000 };
    }
    if depth == 0 {
        return evaluate_board(board, me);
    }

    let available = board.available_cells();
    if available.is_empty() {
        return evaluate_board(board, me);
    }

    let current_player = if maximizing { me } else { other(me) };

    // Ordenar candidatos con el heuristico para la poda
    let mut candidates: Vec<(i32, u32)> = available
        .iter()
        .map(|&cell| {
            let coords = Coordinates::from_index(cell, board.board_size());
            let h = quick_heuristic(board, &coords, current_player);
            (h, cell)
        })
        .collect();

    if maximizing {
        candidates.sort_by(|a, b| b.0.cmp(&a.0));
    } else {
        candidates.sort_by(|a, b| a.0.cmp(&b.0));
    }

    if maximizing {
        let mut max_eval = i32::MIN;
        for (_, cell) in &candidates {
            let coords = Coordinates::from_index(*cell, board.board_size());
            let mut clone = board.clone();
            let mv = Movement::Placement { player: current_player, coords };
            if clone.add_move(mv).is_err() {
                continue;
            }

            let eval = minimax(&clone, depth - 1, alpha, beta, false, me);
            max_eval = max_eval.max(eval);
            alpha = alpha.max(eval);
            if beta <= alpha {
                break; // poda beta
            }
        }
        max_eval
    } else {
        let mut min_eval = i32::MAX;
        for (_, cell) in &candidates {
            let coords = Coordinates::from_index(*cell, board.board_size());
            let mut clone = board.clone();
            let mv = Movement::Placement { player: current_player, coords };
            if clone.add_move(mv).is_err() {
                continue;
            }

            let eval = minimax(&clone, depth - 1, alpha, beta, true, me);
            min_eval = min_eval.min(eval);
            beta = beta.min(eval);
            if beta <= alpha {
                break; // poda alfa
            }
        }
        min_eval
    }
}

// Evaluacion estatica del tablerose usa cuando se alcanza la profundidad máxima
// Mide la diferencia de buen posicionaimiento entre nuestras piezas y las del rival
fn evaluate_board(board: &GameY, me: PlayerId) -> i32 {
    let rival = other(me);
    let my_score = evaluate_player(board, me);
    let rival_score = evaluate_player(board, rival);
    my_score - rival_score
}

// Puntuacion de un jugador: cuantos lados toca su grupo más grande
fn evaluate_player(board: &GameY, player: PlayerId) -> i32 {
    let size = board.board_size();
    let total = (size * (size + 1)) / 2;
    let mut score = 0;

    // Encontrar todos los grupos del jugador con BFS
    let mut visited = HashSet::new();
    let mut best_group_sides = 0u8;

    for idx in 0..total {
        let coords = Coordinates::from_index(idx, size);
        if board.cell_owner(&coords) != Some(player) || visited.contains(&coords) {
            continue;
        }

        // BFS para analizar este grupo
        let mut stack = vec![coords];
        let mut group_size = 0;
        let mut touches_a = false;
        let mut touches_b = false;
        let mut touches_c = false;

        while let Some(current) = stack.pop() {
            if !visited.insert(current) {
                continue;
            }
            group_size += 1;

            if current.touches_side_a() { touches_a = true; }
            if current.touches_side_b() { touches_b = true; }
            if current.touches_side_c() { touches_c = true; }

            for neighbor in board.get_neighbors(&current) {
                if board.cell_owner(&neighbor) == Some(player) && !visited.contains(&neighbor) {
                    stack.push(neighbor);
                }
            }
        }

        let sides = touches_a as u8 + touches_b as u8 + touches_c as u8;
        best_group_sides = best_group_sides.max(sides);

        // Puntuamos según los lados que toca y el tamaño del grupo
        score += match sides {
            3 => 5000,   // conecta los 3 lados
            2 => 200 + group_size * 10,
            1 => 50 + group_size * 5,
            _ => group_size * 2,
        };
    }

    score
}

// heuristico rapido para ordenar jugadas antes de explorar
fn quick_heuristic(board: &GameY, coords: &Coordinates, player: PlayerId) -> i32 {
    let neighbors = board.get_neighbors(coords);
    let mut h = 0i32;

    // Vecinos propios
    let friendly = neighbors.iter().filter(|n| board.cell_owner(n) == Some(player)).count();
    h += friendly as i32 * 10;

    // Vecinos del rival
    let rival = other(player);
    let enemy = neighbors.iter().filter(|n| board.cell_owner(n) == Some(rival)).count();
    h += enemy as i32 * 8;

    // Bonus por borde
    if coords.is_on_edge() { h += 5; }

    // Bonus por cercanía al centro
    let dist = coords.distance_to_center(board.board_size());
    h += (board.board_size() as i32 - dist) * 2;

    h
}

fn other(player: PlayerId) -> PlayerId {
    if player.id() == 0 { PlayerId::new(1) } else { PlayerId::new(0) }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Movement, PlayerId};

    #[test]
    fn test_minimax_bot_returns_valid_move() {
        let bot = MinimaxBot;
        let game = GameY::new(5);
        let coords = bot.choose_move(&game).unwrap();
        let index = coords.to_index(game.board_size());
        assert!(game.available_cells().contains(&index));
    }

    #[test]
    fn test_minimax_bot_returns_none_on_full_board() {
        let bot = MinimaxBot;
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
    fn test_minimax_finds_winning_move() {
        // Tablero pequeño donde el bot puede ganar en un movimiento
        let mut game = GameY::new(3);

        // Player 0 juega arriba
        game.add_move(Movement::Placement {
            player: PlayerId::new(0), coords: Coordinates::new(2, 0, 0),
        }).unwrap();

        // Bot (player 1) coloca en lado A y lado B
        game.add_move(Movement::Placement {
            player: PlayerId::new(1), coords: Coordinates::new(0, 0, 2),
        }).unwrap();

        game.add_move(Movement::Placement {
            player: PlayerId::new(0), coords: Coordinates::new(1, 1, 0),
        }).unwrap();

        game.add_move(Movement::Placement {
            player: PlayerId::new(1), coords: Coordinates::new(0, 1, 1),
        }).unwrap();

        game.add_move(Movement::Placement {
            player: PlayerId::new(0), coords: Coordinates::new(1, 0, 1),
        }).unwrap();

        // El bot debería encontrar la jugada ganadora si existe
        let bot = MinimaxBot;
        let chosen = bot.choose_move(&game).unwrap();
        let index = chosen.to_index(game.board_size());
        assert!(game.available_cells().contains(&index));
    }

    #[test]
    fn test_depth_adapts_to_board_size() {
        assert!(max_depth_for_size(5, 10) >= 3);
        assert!(max_depth_for_size(13, 0) <= 3);
        assert!(max_depth_for_size(5, 14) >= 4);
    }
}
