// Error carrying an HTTP status; the error middleware sends its message to the client.
export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}
