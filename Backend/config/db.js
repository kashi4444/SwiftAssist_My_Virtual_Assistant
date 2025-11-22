import mongoose from 'mongoose'

const connectDB = async()=>{
    try{
        mongoose.connect(process.env.MONGODB_URL);
        console.log("DB Connected Successfully")

    }catch(err){
        console.log("Issue in DB Connection");
    }
}

export default connectDB;