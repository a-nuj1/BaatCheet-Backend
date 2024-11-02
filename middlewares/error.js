const errorMiddler = (err, req, res, next)=>{
    err.message ||= "Internal Server Error"
    err.statusCode ||= 500
    
    
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