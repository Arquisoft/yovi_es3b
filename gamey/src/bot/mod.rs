//! Bot module for the Game of Y.
//!
//! This module provides the infrastructure for creating and managing AI bots
//! that can play the Game of Y. It includes:
//!
//! - [`YBot`] - A trait that defines the interface for all bots
//! - [`YBotRegistry`] - A registry for managing multiple bot implementations
//! - [`RandomBot`] - A simple bot that makes random valid moves
//! - [`HeuristicBot`] - A bot that evaluates positions with multiple criteria
//! - [`MinimaxBot`] - A bot that uses minimax with alpha-beta pruning
//! - [`MonteCarloBot`] - A bot that uses Monte Carlo Tree Search

pub mod random;
pub mod corner;
pub mod heuristic;
pub mod minimax;
pub mod montecarlo;
pub mod ybot;
pub mod ybot_registry;
pub use random::*;
pub use corner::*;
pub use heuristic::*;
pub use minimax::*;
pub use montecarlo::*;
pub use ybot::*;
pub use ybot_registry::*;
