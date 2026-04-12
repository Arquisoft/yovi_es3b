// Simula miles de partidas al azar para cada jugada y elige la que lleva a mas victorias

use crate::{Coordinates, GameY, GameStatus, Movement, PlayerId, YBot};
use rand::prelude::IndexedRandom;
use std::collections::HashMap;

pub struct MonteCarloBot;

const ITERATIONS: u32 = 10_000;

// Constante de exploración para UCB1, controla el equiilibrio entre buscar nuevas jugadas(UCB_C alto) y usar jugadas que ya sabe que funcionan(UCB_C bajo)
const UCB_C: f64 = 1.41; // ponemos un valor medio para buscar equilibrio

impl YBot for MonteCarloBot {
    fn name(&self) -> &str {
        "montecarlo_bot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        let available = board.available_cells();
        if available.is_empty() {
            return None;
        }

        // Si solo queda una casilla, no hace falta pensar
        if available.len() == 1 {
            return Some(Coordinates::from_index(available[0], board.board_size()));
        }

        let me = PlayerId::new(1);

        // Estadísticas de cada jugada
        let mut stats: HashMap<u32, (u32, u32)> = HashMap::new();
        for &cell in available {
            stats.insert(cell, (0, 0));
        }

        let mut total_simulations: u32 = 0;

        for _ in 0..ITERATIONS {
            //  elegimos jugada con UCB1
            let cell = select_move(available, &stats, total_simulations);
            let coords = Coordinates::from_index(cell, board.board_size());

            // aplicamos la jugada
            let mut sim_board = board.clone();
            let mv = Movement::Placement { player: me, coords };
            if sim_board.add_move(mv).is_err() {
                continue;
            }

            // Si ya ganamos con esta jugada, es la mejor
            if let GameStatus::Finished { winner } = sim_board.status() {
                if *winner == me {
                    return Some(coords);
                }
            }

            // partida al azar hasta el final
            let winner = simulate_random_game(&sim_board);

            //actualizamos estadísticas
            let entry = stats.get_mut(&cell).unwrap();
            entry.1 += 1;
            if winner == Some(me) {
                entry.0 += 1;
            }
            total_simulations += 1;
        }

        // Elegimos la jugada con mayor ratio de victorizs
        let best_cell = stats
            .iter()
            .filter(|(_, (_, sims))| *sims > 0)
            .max_by(|(_, (wins_a, sims_a)), (_, (wins_b, sims_b))| {
                let ratio_a = *wins_a as f64 / *sims_a as f64;
                let ratio_b = *wins_b as f64 / *sims_b as f64;
                ratio_a.partial_cmp(&ratio_b).unwrap()
            })
            .map(|(cell, _)| *cell)?;

        Some(Coordinates::from_index(best_cell, board.board_size()))
    }
}

// Selecciona la jugada usando UCB1, equulibra entre jugadas que sabemos que son buenas y jugadas poco exploradas
fn select_move(available: &[u32], stats: &HashMap<u32, (u32, u32)>, total: u32) -> u32 {
    let ln_total = if total > 0 { (total as f64).ln() } else { 0.0 };

    let mut best_ucb = f64::NEG_INFINITY;
    let mut best_cell = available[0];

    for &cell in available {
        let (wins, sims) = stats[&cell];

        if sims == 0 {
            // Jugadas no exploradas tienen prioridad
            return cell;
        }

        let exploitation = wins as f64 / sims as f64;
        let exploration = UCB_C * (ln_total / sims as f64).sqrt();
        let ucb = exploitation + exploration;

        if ucb > best_ucb {
            best_ucb = ucb;
            best_cell = cell;
        }
    }

    best_cell
}

// Simula una partida al azar hasta que termine colocando ambos jugadores piezas en casillas aleatorias.
fn simulate_random_game(board: &GameY) -> Option<PlayerId> {
    let mut sim = board.clone();
    let mut rng = rand::rng();

    loop {
        // Si el juego ya terminó, devolvemos el ganador
        if let GameStatus::Finished { winner } = sim.status() {
            return Some(*winner);
        }

        let available = sim.available_cells().clone();
        if available.is_empty() {
            return None;
        }

        // Elegimos una casilla al azar
        let &cell = available.choose(&mut rng).unwrap();
        let coords = Coordinates::from_index(cell, sim.board_size());

        // Determinamos a quién le toca
        let player = match sim.next_player() {
            Some(p) => p,
            None => return None,
        };

        let mv = Movement::Placement { player, coords };
        if sim.add_move(mv).is_err() {
            continue;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Movement, PlayerId};

    #[test]
    fn test_montecarlo_returns_valid_move() {
        let bot = MonteCarloBot;
        let game = GameY::new(5);
        let coords = bot.choose_move(&game).unwrap();
        let index = coords.to_index(game.board_size());
        assert!(game.available_cells().contains(&index));
    }

    #[test]
    fn test_montecarlo_returns_none_on_full_board() {
        let bot = MonteCarloBot;
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
    fn test_montecarlo_finds_immediate_win() {
        let mut game = GameY::new(2);

        // Player 0 pone una pieza
        game.add_move(Movement::Placement {
            player: PlayerId::new(0), coords: Coordinates::new(1, 0, 0),
        }).unwrap();

        // Bot (player 1) tiene dos casillas: una gana (0,0,1) + (0,1,0) no
        game.add_move(Movement::Placement {
            player: PlayerId::new(1), coords: Coordinates::new(0, 0, 1),
        }).unwrap();

        game.add_move(Movement::Placement {
            player: PlayerId::new(0), coords: Coordinates::new(0, 1, 0),
        }).unwrap();

        // Tablero lleno, no debería haber movimiento
        let bot = MonteCarloBot;
        assert!(bot.choose_move(&game).is_none());
    }

    #[test]
    fn test_montecarlo_consistent_on_small_board() {
        let bot = MonteCarloBot;
        let game = GameY::new(3);

        // Debería devolver jugadas válidas consistentemente
        for _ in 0..5 {
            let coords = bot.choose_move(&game).unwrap();
            let index = coords.to_index(game.board_size());
            assert!(game.available_cells().contains(&index));
        }
    }
}
