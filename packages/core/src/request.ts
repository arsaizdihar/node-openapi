import { MaybePromise } from './type';

/**
 * Abstract base class representing an HTTP request.
 * Serves as a framework-agnostic interface for accessing request data.
 * @template FormValueType - Type for form field values in multipart/form-data requests
 */
export abstract class RequestLike<FormValueType = any> {
  /** Gets the full URL of the request */
  abstract get url(): string;

  /** Gets the HTTP method (GET, POST, etc.) */
  abstract get method(): string;

  /** Gets the HTTP headers as a record of string or string arrays */
  abstract get headers(): Record<string, string | string[] | undefined>;

  /** Gets the raw request body as a string */
  abstract get body(): MaybePromise<string>;

  /** Gets the parsed JSON body */
  abstract get json(): MaybePromise<unknown>;

  /**
   * Gets the form data from a multipart/form-data request
   * Defaults to empty object; should be implemented by framework-specific classes
   */
  get form(): MaybePromise<Record<string, FormValueType | undefined>> {
    return {};
  }

  /** Gets the query parameters from the URL */
  abstract get query(): Record<string, string | string[] | undefined>;

  /** Gets the cookies from the request */
  abstract get cookies(): Record<string, string | string[] | undefined>;

  /** Gets the route parameters (e.g., :id in /users/:id) */
  abstract get params(): MaybePromise<
    Record<string, string | string[] | undefined>
  >;
}
