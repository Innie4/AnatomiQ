export class RouteError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number, options?: ErrorOptions) {
    super(message, options);
    this.name = "RouteError";
    this.statusCode = statusCode;
  }
}

export class UserInputError extends RouteError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 422, options);
    this.name = "UserInputError";
  }
}

export class ConflictError extends RouteError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 409, options);
    this.name = "ConflictError";
  }
}
