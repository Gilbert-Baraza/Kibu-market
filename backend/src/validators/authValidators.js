import { body } from "express-validator";

export const registerValidator = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters."),
  body("email").trim().isEmail().withMessage("A valid email address is required."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  body("avatar").optional().trim().isURL().withMessage("Avatar must be a valid URL."),
  body("phone").optional({ checkFalsy: true }).trim().isLength({ min: 7 }).withMessage("Phone number is too short."),
  body("university").optional().trim().isLength({ min: 2 }).withMessage("University is too short."),
];

export const loginValidator = [
  body("email").trim().isEmail().withMessage("A valid email address is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

export const refreshSessionValidator = [
  body("refreshToken")
    .trim()
    .notEmpty()
    .withMessage("Refresh token is required."),
];

export const updateProfileValidator = [
  body("name").optional().trim().isLength({ min: 2 }).withMessage("Name is too short."),
  body("avatar").optional().trim().isURL().withMessage("Avatar must be a valid URL."),
  body("phone").optional({ checkFalsy: true }).trim().isLength({ min: 7 }).withMessage("Phone number is too short."),
  body("university")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("University is too short."),
];
