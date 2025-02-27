import createError from "http-errors"

/* General HTTP errors */
export class NotFound extends createError.NotFound {}

export class BadRequest extends createError.BadRequest {}

export class Unauthorized extends createError.Unauthorized {}

export class Forbidden extends createError.Forbidden {}

export class PayloadTooLarge extends createError.PayloadTooLarge {}

export class ValidationError extends createError.UnprocessableEntity {
  constructor(message: string, errors?: any) {
    super(message)
    this.errors = errors
  }
}
