"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolrError = void 0;
/**
 * Module dependencies
 */
const http_error_1 = require("./http-error");
class SolrError extends http_error_1.HttpError {
    constructor(req, res, htmlMessage) {
        super(req, res, htmlMessage);
        // Saving class name in the property of our custom error as a shortcut.
        this.name = this.constructor.name;
        // Capturing stack trace, excluding constructor call from it.
        if ('captureStackTrace' in Error) {
            Error.captureStackTrace(this, this.constructor);
        }
        let message = '';
        if (htmlMessage) {
            const matches = htmlMessage.match(/<pre>([\s\S]+)<\/pre>/);
            message = decode((matches || ['', htmlMessage])[1].trim());
        }
        this.statusCode = res.statusCode;
        this.message = message !== null && message !== void 0 ? message : res.statusMessage;
    }
}
exports.SolrError = SolrError;
/**
 * Decode few HTML entities: &<>'"
 *
 * @param {String} str -
 *
 * @return {String}
 * @api private
 */
function decode(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/gm, '<')
        .replace(/&gt;/gm, '>')
        .replace(/&apos;/gm, "'")
        .replace(/&quot;/gm, '"');
}
//# sourceMappingURL=solr-error.js.map