const errorMiddler = (err, req, res, next)=>{
    err.message ||= "Internal Server Error"
    err.statusCode ||= 500
    if(err.code === 11000){
        const error = Object.keys(err.keyValue).join(",");
        err.message = `Duplicate Field - ${error}`
        err.statusCode = 400
    }
    
    if(err.name === "CastError"){
        err.message = `Resource not found. Invalid: ${err.path}`
        err.statusCode = 404
    }


    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
    })
}

const TryCatch = (functionPassed)=>async(req, res, next)=>{
    try {
        await functionPassed(req, res, next)
    } catch (error) {
        next(error)
    }
}

export {errorMiddler, TryCatch}