"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const associations = require("./associations/index");
const ASSOCIATIONS = {
    belongsTo: associations.BelongsTo,
    polymorphic: associations.Polymorphic,
    hasOne: associations.HasOne,
    hasMany: associations.HasMany,
};
class Associations {
    static get types() {
        return Object.keys(ASSOCIATIONS);
    }
    static classOf(type) {
        return ASSOCIATIONS[type];
    }
    constructor(schema) {
        this.schema = schema;
        this.asIndexed = {};
    }
    associate(as) {
        return this.asIndexed[as];
    }
    get model() {
        return this.schema.model;
    }
    get modelName() {
        return this.model.modelName;
    }
    get collectionName() {
        return this.model.collection.name;
    }
    add(type, options) {
        if (!_.includes(Associations.types, type))
            throw `${type} is not a valid association type`;
        const ASSOCIATION = Associations.classOf(type);
        const association = new ASSOCIATION(options, this.schema);
        return this.index(association);
    }
    index(association) {
        const { as } = association;
        return (this.asIndexed[as] = association);
    }
    forEach(func) {
        Object.keys(this.asIndexed).forEach(as => func(this.associate(as)));
    }
}
exports.Associations = Associations;
