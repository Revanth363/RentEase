"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeSpecialChars = exports.stringify = exports.toISOString = exports.dateISOify = void 0;
/**
 * ISOify `Date` objects (possibly in collections)
 * @api private
 */
function dateISOify(obj) {
    if (obj instanceof Array) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = dateISOify(obj[i]);
        }
    }
    else if (obj instanceof Object && !(obj instanceof Date)) {
        for (const key in obj) {
            if (obj[key] instanceof Date)
                obj[key] = toISOString(obj[key]);
        }
    }
    else {
        if (obj instanceof Date) {
            obj = toISOString(obj);
        }
    }
    return obj;
}
exports.dateISOify = dateISOify;
/**
 * ISOify a single `Date` object
 * Sidesteps `Invalid Date` objects by returning `null` instead
 * @api private
 */
function toISOString(date) {
    return date && !isNaN(date.getTime()) ? date.toISOString() : null;
}
exports.toISOString = toISOString;
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
function stringify(obj, sep, eq, name) {
    sep = sep || '&';
    eq = eq || '=';
    obj = obj === null ? undefined : obj;
    if (typeof obj === 'object') {
        return Object.keys(obj)
            .map(function (k) {
            if (Array.isArray(obj[k])) {
                return obj[k]
                    .map(function (v) {
                    return stringifyPrimitive(k) + eq + stringifyPrimitive(v);
                })
                    .join(sep);
            }
            else {
                return stringifyPrimitive(k) + eq + stringifyPrimitive(obj[k]);
            }
        })
            .join(sep);
    }
    if (!name)
        return '';
    return stringifyPrimitive(name) + eq + stringifyPrimitive(obj);
}
exports.stringify = stringify;
/**
 * Stringify a primitive
 * @api private
 */
function stringifyPrimitive(v) {
    switch (typeof v) {
        case 'string':
            return v;
        case 'boolean':
            return v ? 'true' : 'false';
        case 'number':
            return isFinite(v) ? v.toString() : '';
        default:
            return '';
    }
}
/**
 * Escape special characters that are part of the query syntax of Lucene
 * @api public
 */
function escapeSpecialChars(s) {
    return s
        .replace(/([\+\-!\(\)\{\}\[\]\^"~\*\?:\\\/])/g, function (match) {
        return '\\' + match;
    })
        .replace(/&&/g, '\\&\\&')
        .replace(/\|\|/g, '\\|\\|');
}
exports.escapeSpecialChars = escapeSpecialChars;
//# sourceMappingURL=format.js.map