/**
 * Migration script: Migrate Game documents from username to userId
 * 
 * This script:
 * 1. For each Game document with a username field
 * 2. Finds the corresponding User by username
 * 3. Updates the Game to use userId instead of username
 * 4. Removes the username field from Game documents
 * 
 * Usage: npm run migrate:games-to-userid
 */

import User from '../db/models/User.js'
import Game from '../db/models/Game.js'
import { connectMongo } from '../db/mongo.js'

async function migrateGamesToUserId() {
  try {
    console.log('📦 Starting migration: Games username → userId...')
    await connectMongo()
    
    // Find all games that have a username field (old documents)
    const gamesWithUsername = await Game.find({ username: { $exists: true } })
    console.log(`Found ${gamesWithUsername.length} games to migrate`)
    
    if (gamesWithUsername.length === 0) {
      console.log('✅ No games to migrate - all games already use userId')
      process.exit(0)
    }
    
    let migratedCount = 0
    let errorCount = 0
    
    for (const game of gamesWithUsername) {
      try {
        // Find the user by username
        const user = await User.findOne({ username: game.username })
        
        if (!user) {
          console.warn(`⚠️ Game ${game._id}: User with username "${game.username}" not found, skipping`)
          errorCount++
          continue
        }
        
        // Update the game with userId and remove username
        await Game.updateOne(
          { _id: game._id },
          {
            $set: { userId: user._id },
            $unset: { username: 1 }
          }
        )
        
        migratedCount++
        if (migratedCount % 50 === 0) {
          console.log(`✓ Migrated ${migratedCount} games...`)
        }
      } catch (err) {
        console.error(`❌ Error migrating game ${game._id}:`, err.message)
        errorCount++
      }
    }
    
    console.log(`\n✅ Migration complete!`)
    console.log(`   ✓ Migrated: ${migratedCount} games`)
    console.log(`   ⚠️ Errors: ${errorCount} games`)
    
    process.exit(errorCount === 0 ? 0 : 1)
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
}

migrateGamesToUserId()
