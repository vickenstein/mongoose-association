"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const mongoose = require("mongoose");
const inflection = require("inflection");
const Has_1 = require("./Has");
const OPTIONS = {
    nested: 'create has many nested within model'
};
class HasMany extends Has_1.Has {
    static get options() {
        return Object.keys(OPTIONS).concat(Has_1.Has.options);
    }
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
    get localField() {
        if (this.nested) {
            return this.define('localField', inflection.pluralize(Has_1.Has.idlize(inflection.singularize(this.as))));
        }
        else {
            return super.localField;
        }
    }
    findFor(document) {
        if (this.nested) {
            return this.findNestedFor(document);
        }
        return super.findFor(document);
    }
    findManyFor(documents) {
        if (this.nested) {
            return this.findManyNestedFor(documents);
        }
        return super.findManyFor(documents);
    }
    findNestedFor(document) {
        if (document instanceof Array) {
            if (!document.length)
                return (new mongoose.Query()).noop();
            return this.findManyNestedFor(document);
        }
        const { foreignModelName: modelName, localField } = this;
        return HasMany.find({
            modelName,
            localField: '_id',
            localFieldValue: document[localField]
        });
    }
    findManyNestedFor(documents) {
        const { foreignModelName: modelName, localField } = this;
        return HasMany.find({
            modelName,
            localField: '_id',
            localFieldValue: _.flatten(_.map(documents, document => document[localField]))
        });
    }
}
exports.HasMany = HasMany;
