use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use crate::{Coordinates, GameStatus, GameY, YEN};
use crate::bot_server::error::ErrorResponse;
use crate::bot_server::state::AppState;

fn resolve_bot_id(bot_id: &str) -> &str {
    match bot_id {
        "easy"       => "random_bot",
        "hard"       => "heuristic_bot",
        "extreme"    => "minimax_bot",
        "impossible" => "montecarlo_bot",
        "corner"     => "corner_bot",
        _            => "random_bot",
    }
}

fn apply_move_to_yen(yen: &YEN, coords: &Coordinates) -> Result<YEN, String> {
    let mut rows: Vec<String> = yen.layout().split('/').map(str::to_string).collect();
    let size = yen.size() as i32;
    let x = coords.x() as i32;
    if x >= size {
        return Err(format!("Coordinate x={} out of bounds for size={}", x, size));
    }
    let row_index = (size - 1 - x) as usize;

    let row = rows.get_mut(row_index)
        .ok_or_else(|| format!("Row index {} out of bounds", row_index))?;

    let col = coords.y() as usize;
    if col >= row.len() {
        return Err(format!("Column {} out of bounds in row {}", col, row_index));
    }

    let player_char = yen.players()
        .get(yen.turn() as usize)
        .ok_or_else(|| format!("No player at turn index {}", yen.turn()))?;

    let mut chars: Vec<char> = row.chars().collect();
    chars[col] = *player_char;
    *row = chars.into_iter().collect();

    let next_turn = (yen.turn() + 1) % yen.players().len() as u32;

    Ok(YEN::new(
        yen.size(),
        next_turn,
        yen.players().to_vec(),
        rows.join("/"),
    ))
}

#[derive(Deserialize)]
pub struct PlayRequest {
    pub position: YEN,
    pub bot_id: Option<String>,
}

#[derive(Serialize)]
pub struct PlayResponse {
    pub position: Option<YEN>,
    #[serde(rename = "move")]
    pub move_coords: Option<Coordinates>,
    pub status: GameStatus,
}

#[axum::debug_handler]
pub async fn play(
    State(state): State<AppState>,
    Json(req): Json<PlayRequest>,
) -> Result<Json<PlayResponse>, (StatusCode, Json<ErrorResponse>)> {
    let yen = req.position;
    let difficulty = req.bot_id.as_deref().unwrap_or("easy");
    let internal_bot_id = resolve_bot_id(difficulty);

    let game_y = GameY::try_from(yen.clone()).map_err(|err| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::error(
                &format!("Invalid YEN format: {}", err),
                None,
                Some(difficulty.to_string()),
            )),
        )
    })?;

    if game_y.check_game_over() {
        return Ok(Json(PlayResponse {
            position: None,
            move_coords: None,
            status: game_y.status().clone(),
        }));
    }

    let bot = state.bots().find(internal_bot_id).ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::error(
                &format!("Bot not found: {} (resolved from '{}')", internal_bot_id, difficulty),
                None,
                Some(difficulty.to_string()),
            )),
        )
    })?;

    let coords = bot.choose_move(&game_y).ok_or_else(|| {
        (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(ErrorResponse::error(
                "No valid moves available",
                None,
                Some(difficulty.to_string()),
            )),
        )
    })?;

    let updated_yen = apply_move_to_yen(&yen, &coords).map_err(|err| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::error(&err, None, Some(difficulty.to_string()))),
        )
    })?;

    Ok(Json(PlayResponse {
        position: Some(updated_yen),
        move_coords: Some(coords),
        status: game_y.status().clone(),
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_yen() -> YEN {
        YEN::new(4, 1, vec!['B', 'R'], "B/.B/RB./B..R".to_string())
    }

    #[test]
    fn test_resolve_bot_id() {
        assert_eq!(resolve_bot_id("easy"), "random_bot");
        assert_eq!(resolve_bot_id("hard"), "heuristic_bot");
        assert_eq!(resolve_bot_id("extreme"), "minimax_bot");
        assert_eq!(resolve_bot_id("impossible"), "montecarlo_bot");
        assert_eq!(resolve_bot_id("corner"), "corner_bot");
        assert_eq!(resolve_bot_id("unknown"), "random_bot");
    }

    #[test]
    fn test_apply_move_to_yen_advances_turn() {
        let yen = sample_yen();
        let coords = Coordinates::new(0, 1, 2);
        let updated = apply_move_to_yen(&yen, &coords).unwrap();
        assert_eq!(updated.turn(), 0);
    }

    #[test]
    fn test_apply_move_to_yen_places_correct_player() {
        let yen = sample_yen();
        let coords = Coordinates::new(0, 2, 1);
        let updated = apply_move_to_yen(&yen, &coords).unwrap();
        let rows: Vec<&str> = updated.layout().split('/').collect();
        assert_eq!(rows[3].chars().nth(2), Some('R'));
    }

    #[test]
    fn test_apply_move_preserves_size_and_players() {
        let yen = sample_yen();
        let coords = Coordinates::new(0, 0, 3);
        let updated = apply_move_to_yen(&yen, &coords).unwrap();
        assert_eq!(updated.size(), yen.size());
        assert_eq!(updated.players(), yen.players());
    }

    #[test]
    fn test_apply_move_out_of_bounds_row() {
        let yen = sample_yen();
        let coords = Coordinates::new(10, 0, 0);
        let result = apply_move_to_yen(&yen, &coords);
        assert!(result.is_err());
    }
}
