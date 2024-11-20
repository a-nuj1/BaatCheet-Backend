import { body, param, validationResult } from "express-validator";
import { ErrorHandler } from "../utils/utility.js";

const validateHandler = (req, res, next) => {
  const errors = validationResult(req);

  const errorMessages = errors
    .array()
    .map((error) => error.msg)
    .join(", ");

  // console.log(errorMessages);
  if (errors.isEmpty()) {
    return next();
  } else next(new ErrorHandler(errorMessages, 400));
};

const resiterValidator = () => [
  body("name", "Enter Your Name").notEmpty(),
  body("username", "Please Enter Username").notEmpty(),
  body("bio", "Enter Your Bio").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
  // check("avatar", "Please Upload Avatar").notEmpty(),
];

const loginValidator = () => [
  body("username", "Please Enter Username").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
];

const newGroupValidator = () => [
  body("name", "Enter Group Name").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Add Members")
    .isArray({ min: 2 })
    .withMessage("Add Atleast 2 Members"),
  // check("avatar","Please Upload Avatar").notEmpty(),
];

const addMembersValidator = () => [
  body("chatId", "Enter Chat Id").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Add Members")
    .isArray({ min: 1 })
    .withMessage("Add Atleast 1 Members"),
];

const removeMembersValidator = () => [
  body("chatId", "Enter Chat Id").notEmpty(),
  body("userId", "Enter User Id").notEmpty(),
];

const sendAttachmentsValidator = () => [
  body("chatId", "Enter Chat Id").notEmpty(),
  // body("message", "Enter Message").notEmpty(),
  
];

const chatIdValidator = () => [
  param("id", "Enter Chat Id").notEmpty(),
  // query("page", "Enter Page Number").notEmpty(),
];

const renameValidator = () => [
  param("id", "Enter Chat Id").notEmpty(),
  body("name", "Enter Group Name").notEmpty(),
];

const sendRequestValidator = () => [body("userId", "Enter User ID").notEmpty()];

const acceptRequestValidator = () => [
  body("requestId", "Enter Request ID").notEmpty(),
  body("accept")
    .notEmpty()
    .withMessage("Please Add Accept")
    .isBoolean()
    .withMessage("Accept Must be a Boolean"),
];


const adminLoginValidator = () => [
  body("secretKey", "Please Enter Secret Key..").notEmpty(),
]



export {
  acceptRequestValidator, addMembersValidator, adminLoginValidator, chatIdValidator, loginValidator,
  newGroupValidator, removeMembersValidator, renameValidator, resiterValidator, sendAttachmentsValidator, sendRequestValidator, validateHandler
};

