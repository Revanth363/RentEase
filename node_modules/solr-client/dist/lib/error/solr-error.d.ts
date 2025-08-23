/**
 * Module dependencies
 */
import { HttpError } from './http-error';
export declare class SolrError extends HttpError {
    statusCode: any;
    constructor(req: any, res: any, htmlMessage: any);
}
