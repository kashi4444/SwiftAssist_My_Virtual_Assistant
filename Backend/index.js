import express from 'express'
import dotenv from 'dotenv'
dotenv.config();
import connectDB from './config/db.js';
import authRouter from './routes/auth.routes.js'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.routes.js';
import geminiResponse from './gemini.js';

const app = express();

const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin : process.env.FRONTEND_URL,
    credentials: true
}))
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.get("/", (req,res)=>{
    res.send("Hii");
})

app.listen(port, ()=>{
    connectDB();
    console.log(`Server is running at ${port}`);
})
