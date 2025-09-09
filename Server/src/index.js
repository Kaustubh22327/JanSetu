import dotenv from "dotenv"
import app from './app.js'
import connectDB from "./db/connectTomongoDb.js"
import { autoSeedIfEmpty } from "./seeds/seedPosts.js"

dotenv.config({
    path:'./env'
})

app.get('/', (req, res)=>{
    res.send("server is running")
})

connectDB()
.then(async ()=>{
  // Auto-seed flood posts if database is empty
  try {
    const seedResult = await autoSeedIfEmpty();
    if (seedResult.success && seedResult.postsCreated > 0) {
      console.log(`🌊 Auto-seeded ${seedResult.postsCreated} flood posts for better user experience`);
    }
  } catch (error) {
    console.log("⚠️  Auto-seeding failed, but server will continue:", error.message);
  }

  app.listen(8000, ()=>{
    console.log(`🚀 Server is running on port 8000`);
    console.log(`📱 Feed available at: http://localhost:5173/feed`);
  })
})
.catch((err) => {
  console.log("MongoDb connection failed", err)
})