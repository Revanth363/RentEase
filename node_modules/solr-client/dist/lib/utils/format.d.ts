import { DateOptions } from '../types';
export declare function dateISOify(obj: Record<string, Date>): Record<string, string>;
export declare function dateISOify(obj: Date[]): string[];
export declare function dateISOify(obj: DateOptions | DateOptions[]): DateOptions | DateOptions[];
export declare function dateISOify(obj: string | number | Date | boolean): string;
/**
 * ISOify a single `Date` object
 * Sidesteps `Invalid Date` objects by returning `null` instead
 * @api private
 */
export declare function toISOString(date: Date): string | null;
/**
 * Serialize an object to a string. Optionally override the default separator ('&') and assignment ('=') characters.
 *
 * @param {Object} obj - object to serialize
 * @param {String} [sep] - separator character
 * @param {String} [eq] - assignment character
 * @param {String} [name] -
 *
 * @return {String}
 * @api private
 */
export declare function stringify(obj: Record<string, any> | null | undefined, sep?: string, eq?: string, name?: string): string;
/**
 * Escape special characters that are part of the query syntax of Lucene
 * @api public
 */
export declare function escapeSpecialChars(s: string): string;
