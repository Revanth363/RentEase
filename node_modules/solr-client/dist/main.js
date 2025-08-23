"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collection = exports.Query = exports.Client = exports.createClient = void 0;
var solr_1 = require("./lib/solr");
Object.defineProperty(exports, "createClient", { enumerable: true, get: function () { return solr_1.createClient; } });
Object.defineProperty(exports, "Client", { enumerable: true, get: function () { return solr_1.Client; } });
var query_1 = require("./lib/query");
Object.defineProperty(exports, "Query", { enumerable: true, get: function () { return query_1.Query; } });
var collection_1 = require("./lib/collection");
Object.defineProperty(exports, "Collection", { enumerable: true, get: function () { return collection_1.Collection; } });
//# sourceMappingURL=main.js.map