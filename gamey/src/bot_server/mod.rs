//! HTTP server for Y game bots.
//!
//! This module provides an Axum-based REST API for querying Y game bots.
//! The server exposes endpoints for checking bot status and requesting moves.
//!
//! # Endpoints
//! - `GET /status` - Health check endpoint
//! - `GET /play` - Request a bot move (external API)
//! - `POST /{api_version}/ybot/choose/{bot_id}` - Request a move from a specific bot
//! - `GET /api-docs` - Swagger UI (served from CDN)

pub mod choose;
pub mod error;
pub mod play;
pub mod state;
pub mod version;

use axum::http::HeaderMap;
use axum::{
    http::header,
    response::{IntoResponse, Response},
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};

pub use choose::MoveResponse;
pub use error::ErrorResponse;
pub use play::PlayResponse;
pub use version::*;

use crate::{
    state::AppState,
    CornerBot,
    GameYError,
    HeuristicBot,
    MinimaxBot,
    MonteCarloBot,
    RandomBot,
    YBotRegistry,
};

/// Serve
/// s the raw openapi.yaml file embedded at compile time.
async fn openapi_yaml() -> Response {
    let yaml = include_str!("openapi.yaml");
    (
        [(header::CONTENT_TYPE, "application/yaml")],
        yaml,
    )
        .into_response()
}

async fn swagger_ui(headers: HeaderMap) -> Response {
    let host = headers
        .get("host")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("localhost:4000");
    
    Response::builder()
        .status(302)
        .header("Location", format!("https://petstore.swagger.io/?url=http://{}/api-docs/openapi.yaml", host))
        .body("".into())
        .unwrap()
}

/// Creates the Axum router with the given state.
pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/api-docs", get(swagger_ui))
        .route("/api-docs/openapi.yaml", get(openapi_yaml))
        .route("/status", get(status))
        .route("/play", get(play::play))
        .route(
            "/{api_version}/ybot/choose/{bot_id}",
            post(choose::choose),
        )
        .with_state(state)
}

/// Creates the default application state with the standard bot registry.
pub fn create_default_state() -> AppState {
    let bots = YBotRegistry::new()
        .with_bot(Arc::new(RandomBot))
        .with_bot(Arc::new(CornerBot))
        .with_bot(Arc::new(HeuristicBot))
        .with_bot(Arc::new(MinimaxBot))
        .with_bot(Arc::new(MonteCarloBot));
    AppState::new(bots)
}

/// Starts the bot server on the specified port.
pub async fn run_bot_server(port: u16) -> Result<(), GameYError> {
    let state = create_default_state();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_headers(Any)
        .allow_methods(Any);
    let app = create_router(state).layer(cors);

    let addr = format!("0.0.0.0:{port}");
    let listener = TcpListener::bind(&addr)
        .await
        .map_err(|e| GameYError::ServerError {
            message: format!("Failed to bind to {addr}: {e}"),
        })?;

    println!("Server mode: Listening on http://{addr}");
    axum::serve(listener, app)
        .await
        .map_err(|e| GameYError::ServerError {
            message: format!("Server error: {e}"),
        })?;

    Ok(())
}

/// Health check endpoint handler.
pub async fn status() -> impl IntoResponse {
    "OK"
}