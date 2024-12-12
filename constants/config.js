
const corsOptions = {
    
    origin: [
        "http://localhost:5173", 
        "http://localhost:4173", 
        process.env.CLIENT_URL
    ],
    credentials: true,
      
}

const BAATCHEET_TOKEN = "Battcheet-token";

export {corsOptions, BAATCHEET_TOKEN}