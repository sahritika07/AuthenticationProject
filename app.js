import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import connectDB from './config/connectdb.js'
import userRoutes from './routes/userRoutes.js'

const app = express()
const port = process.env.PORT // accessing the port
const DATABASE_URL = process.env.DATABASE_URL

app.use(cors())
connectDB(DATABASE_URL)
app.use(express.json())

// Load Routes

app.use("/api/user", userRoutes)


app.listen(port, ()=>{
    console.log(`Server listening at http://localhost:${port}`)
})
