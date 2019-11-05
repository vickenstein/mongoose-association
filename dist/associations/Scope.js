"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Association_1 = require("./Association");
const OPTIONS = {
    as: 'name of the property to store the reference object',
};
class Scope {
    constructor(name, association, match = {}, options = {}) {
        this.name = name;
        this.association = association;
        this.match = match;
        this.options = options;
        return this;
    }
    static get options() {
        return Object.keys(OPTIONS);
    }
    set options(options) {
        this.constructor.options.forEach((option) => {
            const value = options[option];
            if (value)
                this.define(option, options[option]);
        });
    }
    define(property, value) {
        Object.defineProperty(this, property, { value });
        return value;
    }
    get as() {
        return this.define('as', `${Association_1.Association.decapitalize(this.name)}${Association_1.Association.capitalize(this.association.as)}`);
    }
    get _as() {
        return this.define('_as', Association_1.Association.cacheKey(this.as));
    }
    get $as() {
        return this.define('$as', Association_1.Association.variablize(this.as));
    }
    get $fetch() {
        return this.define('$fetch', `fetch${Association_1.Association.capitalize(this.as)}`);
    }
    get $unset() {
        return this.define('$unset', `unset${Association_1.Association.capitalize(this.as)}`);
    }
    get localField() {
        return this.define('localField', this.association.localField);
    }
    get foreignField() {
        return this.define('foreignField', this.association.foreignField);
    }
    get through() {
        return this.define('through', this.association.through);
    }
    get throughAsAssociation() {
        return this.define('throughAsAssociation', this.association.throughAsAssociation);
    }
    get associationType() {
        return this.define('associationType', this.association.associationType);
    }
    get nested() {
        return this.define('nested', this.association.nested);
    }
    get foreignModelName() {
        return this.define('foreignModelName', this.association.foreignModelName);
    }
    findFor(document) {
        const query = this.association.findFor(document, {
            preserveNullAndEmptyArrays: false
        });
        if (this.association.through) {
            query.where({
                [this.association.throughAsAssociation.as]: this.match
            });
        }
        else {
            query.where(this.match);
        }
        return query;
    }
    aggregateTo(aggregate) {
        const query = this.association.aggregateTo(aggregate, {
            preserveNullAndEmptyArrays: false,
            scopeAs: this.as
        });
        if (this.association.through) {
            query.where({
                [this.association.throughAsAssociation.as]: this.match
            });
        }
        else {
            query.where({
                [this.as]: this.match
            });
        }
        return query;
    }
}
exports.Scope = Scope;
