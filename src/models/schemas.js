import joi from 'joi';

export const signinSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).max(16).required(),
  });

export const signupSchema = joi.object({
  name: joi.string().min(3).max(16).required(),
  email: joi.string().email().required(),
  password: joi.string().min(6).max(16).required(),
  confirmPassword: joi.ref("password"),
});

export const urlSchema = joi.object({
    url: joi.string().uri().required(),
  });
