export async function validateToken(req,res,next){
    const { authorization } = req.headers;
    const token = authorization?.substring(7)
    if (!token) return res.sendStatus(401);
    
    next();
}