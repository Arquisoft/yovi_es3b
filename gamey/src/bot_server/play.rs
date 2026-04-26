use axum::{extract::{Query, State}, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use crate::{Coordinates, GameY, YEN};
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

#[derive(Deserialize)]
pub struct PlayQuery {
    pub position: String,
    pub bot_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct PlayResponse {
    pub coords: Coordinates,
}

#[axum::debug_handler]
pub async fn play(
    State(state): State<AppState>,
    Query(query): Query<PlayQuery>,
) -> Result<Json<PlayResponse>, (StatusCode, Json<ErrorResponse>)> {
    let yen: YEN = serde_json::from_str(&query.position).map_err(|err| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::error(
                &format!("Invalid YEN JSON: {}", err),
                None,
                query.bot_id.clone(),
            )),
        )
    })?;

    let difficulty = query.bot_id.as_deref().unwrap_or("impossible");
    let internal_bot_id = resolve_bot_id(difficulty);

    let game_y = GameY::try_from(yen).map_err(|err| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::error(
                &format!("Invalid YEN format: {}", err),
                None,
                query.bot_id.clone(),
            )),
        )
    })?;

    let bot = state.bots().find(internal_bot_id).ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::error(
                &format!("Bot not found: {}", internal_bot_id),
                None,
                query.bot_id.clone(),
            )),
        )
    })?;

    let coords = bot.choose_move(&game_y).ok_or_else(|| {
        (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(ErrorResponse::error(
                "No valid moves available",
                None,
                query.bot_id.clone(),
            )),
        )
    })?;

    Ok(Json(PlayResponse { coords }))
}

#[cfg(test)]
mod tests {
    use super::*;

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
    fn test_play_response_serializes_correctly() {
        let coords = Coordinates::new(1, 1, 1);
        let resp = PlayResponse { coords };
        let json = serde_json::to_string(&resp).unwrap();
        assert!(json.contains("\"coords\""));
    }

    #[test]
    fn test_play_query_position_is_string() {
        let yen_str = r#"{"size":4,"turn":1,"players":["B","R"],"layout":"B/.B/RB./B..R"}"#;
        let yen: YEN = serde_json::from_str(yen_str).unwrap();
        assert_eq!(yen.size(), 4);
    }
}
