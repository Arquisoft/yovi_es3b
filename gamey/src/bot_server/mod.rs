//! HTTP server for Y game bots.
//!
//! This module provides an Axum-based REST API for querying Y game bots.
//! The server exposes endpoints for checking bot status and requesting moves.
//!
//! # Endpoints
//! - `GET /status` - Health check endpoint
//! - `POST /{api_version}/ybot/choose/{bot_id}` - Request a move from a bot

pub mod choose;
pub mod error;
pub mod state;
pub mod version;

use axum::{
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};

pub use choose::MoveResponse;
pub use error::ErrorResponse;
pub use version::*;

use crate::{
    state::AppState,
    GameYError,
    RandomBot,
    YBotRegistry,
};

/// Creates the Axum router with the given state.
pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/status", get(status))
        .route(
            // ✅ Axum 0.8: parámetros de ruta con llaves {param}
            "/{api_version}/ybot/choose/{bot_id}",
            post(choose::choose),
        )
        .with_state(state)
}

/// Creates the default application state with the standard bot registry.
pub fn create_default_state() -> AppState {
    let bots = YBotRegistry::new().with_bot(Arc::new(RandomBot));
    AppState::new(bots)
}

/// Starts the bot server on the specified port.
pub async fn run_bot_server(port: u16) -> Result<(), GameYError> {
    // Estado por defecto
    let state = create_default_state();

    // CORS permisivo para desarrollo (restringe en prod)
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_headers(Any)
        .allow_methods(Any);

    // Router con CORS
    let app = create_router(state).layer(cors);

    // En Docker: bind en 0.0.0.0
    let addr = format!("0.0.0.0:{port}");
    let listener = TcpListener::bind(&addr)
        .await
        .map_err(|e| GameYError::ServerError {
            message: format!("Failed to bind to {addr}: {e}"),
        })?;

    println!("Server mode: Listening on http://{addr}");

    // Bloquea hasta que el server se detiene
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