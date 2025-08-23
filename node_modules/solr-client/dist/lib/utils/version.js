"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.version = exports.versionsEnum = exports.Solr5_1 = exports.Solr5_0 = exports.Solr4_0 = exports.Solr3_2 = void 0;
/**
 * The purpose of those helpers is to centralize and standardize the work on detecting current running Solr Version
 */
exports.Solr3_2 = 302;
exports.Solr4_0 = 400;
exports.Solr5_0 = 500;
exports.Solr5_1 = 501;
/**
 * Enum that lists supported versions of Solr. Pass one of the keys from this enum as a solrVersion property
 *
 * @type {{3.2: number, 4.0: number, 5.0: number, 5.1: number}}
 */
exports.versionsEnum = {
    3.2: exports.Solr3_2,
    '4.0': exports.Solr4_0,
    '5.0': exports.Solr5_0,
    5.1: exports.Solr5_1,
};
/**
 * solrVersion must match one of enum keys
 * If a number is passed, it'll be assume a .0 release (3 -> 3.0)
 * If nothing matches, it will be assumed 3.2
 *
 * @param solrVersion
 */
function version(solrVersion) {
    return typeof solrVersion === 'number'
        ? exports.versionsEnum['' + solrVersion + '.0']
        : exports.versionsEnum[solrVersion]
            ? exports.versionsEnum[solrVersion]
            : exports.versionsEnum['3.2'];
}
exports.version = version;
//# sourceMappingURL=version.js.map