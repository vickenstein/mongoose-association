"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Has_1 = require("./Has");
class HasOne extends Has_1.Has {
    static get query() {
        return Has_1.Has.findOne;
    }
    get associationType() {
        return this.define('associationType', 'hasOne');
    }
}
exports.HasOne = HasOne;
