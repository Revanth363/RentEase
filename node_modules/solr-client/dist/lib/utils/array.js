"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toArray = void 0;
function toArray(value, defaultValue) {
    if (Array.isArray(value)) {
        return value;
    }
    defaultValue = defaultValue || '';
    return value === null || value === undefined
        ? [defaultValue]
        : [value];
}
exports.toArray = toArray;
//# sourceMappingURL=array.js.map