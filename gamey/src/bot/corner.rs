    //! A simple random bot implementation.
    //!
    //! This module provides [`RandomBot`], a bot that makes random valid moves.
    //! It is useful for testing and as a baseline opponent.

    use crate::{Coordinates, GameY, YBot};
    use rand::prelude::IndexedRandom;

    /// A bot that chooses moves prioritizing corners and sides.
    ///

    ///
    /// # Example
    ///
    /// ```
    ///
    /// let bot = CornerBot;
    /// let game = GameY::new(5);
    ///
    /// // The bot will always return Some when there are available moves
    /// let chosen_move = bot.choose_move(&game);
    /// assert!(chosen_move.is_some());
    /// ```
pub struct CornerBot;

impl YBot for CornerBot {

    fn name(&self) -> &str {
        "corner_bot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        let available = board.available_cells();
        if available.is_empty() {
            return None;
        }

        let mut best_score = i32::MIN;
        let mut best_move = None;

        for &cell in available {
            let coords = Coordinates::from_index(cell, board.board_size());
            let mut score = 0;

            if coords.is_on_edge() {
                score += 10;
            }
            if score > best_score {
                best_score = score;
                best_move = Some(coords);
            }
        }

    
        best_move
    }
}

    #[cfg(test)]
    mod tests {
        use super::*;
        use crate::{Movement, PlayerId};

        #[test]
        fn test_corner_bot_returns_valid_coordinates() {
            let bot = CornerBot;
            let game = GameY::new(5);

            let coords = bot.choose_move(&game).unwrap();
            let index = coords.to_index(game.board_size());

            // Index should be within the valid range for a size-5 board
            // Total cells = (5 * 6) / 2 = 15
            assert!(index < 15);
        }

        #[test]
        fn test_corner_bot_returns_none_on_full_board() {
            let bot = CornerBot;
            let mut game = GameY::new(2);

            // Fill the board (size 2 has 3 cells)
            let moves = vec![
                Movement::Placement {
                    player: PlayerId::new(0),
                    coords: Coordinates::new(1, 0, 0),
                },
                Movement::Placement {
                    player: PlayerId::new(1),
                    coords: Coordinates::new(0, 1, 0),
                },
                Movement::Placement {
                    player: PlayerId::new(0),
                    coords: Coordinates::new(0, 0, 1),
                },
            ];

            for mv in moves {
                game.add_move(mv).unwrap();
            }

            // Board is now full
            assert!(game.available_cells().is_empty());
            let chosen_move = bot.choose_move(&game);
            assert!(chosen_move.is_none());
        }

        #[test]
        fn test_corner_bot_chooses_from_available_cells() {
            let bot = CornerBot;
            let mut game = GameY::new(3);

            // Make some moves to reduce available cells
            game.add_move(Movement::Placement {
                player: PlayerId::new(0),
                coords: Coordinates::new(2, 0, 0),
            })
            .unwrap();

            let coords = bot.choose_move(&game).unwrap();
            let index = coords.to_index(game.board_size());

            // The chosen index should be in the available cells
            assert!(game.available_cells().contains(&index));
        }

        #[test]
        fn test_corner_bot_multiple_calls_return_valid_moves() {
            let bot = CornerBot;
            let game = GameY::new(7);

            // Call choose_move multiple times to exercise the randomness
            for _ in 0..10 {
                let coords = bot.choose_move(&game).unwrap();
                let index = coords.to_index(game.board_size());

                // Total cells for size 7 = (7 * 8) / 2 = 28
                assert!(index < 28);
                assert!(game.available_cells().contains(&index));
            }
        }
    }
