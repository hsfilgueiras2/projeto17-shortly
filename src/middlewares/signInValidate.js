import { signinSchema } from "../models/schemas.js";
  
  export async function signInValidate (req, res, next) {
    const data = req.body;
    const {error} = signinSchema.validate(data, {abortEarly: false});
    if (error) {
      const message = error.details.map(e => e.message);
      console.log('Error: ' + message);
      return res.status(422).send(message);
    }
    next();
  };