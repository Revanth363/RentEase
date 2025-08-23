/**
 * The purpose of those helpers is to centralize and standardize the work on detecting current running Solr Version
 */
export declare const Solr3_2 = 302;
export declare const Solr4_0 = 400;
export declare const Solr5_0 = 500;
export declare const Solr5_1 = 501;
/**
 * Enum that lists supported versions of Solr. Pass one of the keys from this enum as a solrVersion property
 *
 * @type {{3.2: number, 4.0: number, 5.0: number, 5.1: number}}
 */
export declare const versionsEnum: {
    3.2: number;
    '4.0': number;
    '5.0': number;
    5.1: number;
};
/**
 * solrVersion must match one of enum keys
 * If a number is passed, it'll be assume a .0 release (3 -> 3.0)
 * If nothing matches, it will be assumed 3.2
 *
 * @param solrVersion
 */
export declare function version(solrVersion: any): any;
