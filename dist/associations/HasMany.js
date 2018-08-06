"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inflection = require("inflection");
const Has_1 = require("./Has");
class HasMany extends Has_1.Has {
    static get query() {
        return HasMany.find;
    }
    get associationType() {
        return this.define('associationType', 'hasMany');
    }
    get as() {
        return this.define('as', inflection.pluralize(Has_1.Has.decapitalize(this.foreignModelName)));
    }
    get throughWith() {
        return this.define('throughWith', this.throughModelName && inflection.pluralize(Has_1.Has.decapitalize(this.throughModelName)));
    }
}
exports.HasMany = HasMany;
