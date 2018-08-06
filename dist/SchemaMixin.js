"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const mongoose = require("mongoose");
const Associations_1 = require("./Associations");
const Collection_1 = require("./Collection");
const { ObjectId } = mongoose.Schema.Types;
class SchemaMixin extends mongoose.Schema {
    associate(as) {
        if (!this.associations)
            throw 'this schema does not have any associations';
        return this.associations.associate(as);
    }
    indexAssociations(...associations) {
        const lastAssociation = associations[associations.length - 1];
        let options;
        if (!lastAssociation || lastAssociation instanceof Object) {
            options = associations.pop();
        }
        const indexes = {};
        associations.forEach(([association, order]) => {
            indexes[association.localField] = order;
            if (association.associationType === 'polymorphic')
                indexes[association.typeField] = order;
        });
        this.index(indexes, options);
        return this;
    }
    belongsTo(foreignModelName, options = {}, schemaOptions = {}) {
        if (!this.associations)
            this.associations = new Associations_1.Associations(this);
        const association = this.associations.add('belongsTo', _.merge({}, options, { foreignModelName }));
        this.defineBelongsToSchema(association, schemaOptions);
        this.defineBelongsToVirtual(association);
        return association;
    }
    defineBelongsToSchema({ foreignModelName, localField }, schemaOptions = {}) {
        function get() {
            const _id = this._doc[localField];
            if (!_id)
                return _id;
            if (_id.constructor.name !== 'ObjectID')
                return _id._id;
            return _id;
        }
        _.merge(schemaOptions, {
            type: ObjectId,
            ref: foreignModelName,
            get
        });
        const schema = {};
        schema[localField] = schemaOptions;
        this.add(schema);
    }
    defineBelongsToVirtual(association) {
        const { as, _as, $as, localField, $fetch, $unset } = association;
        this.virtual(as).get(function get() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!Object.prototype.hasOwnProperty.call(this, _as)) {
                    const reference = this._doc[localField];
                    // using native mongoose localField populate design for belongsTo
                    if (!reference)
                        return null;
                    if (reference.constructor instanceof association.foreignModel) {
                        this[_as] = reference;
                    }
                    else {
                        this[_as] = yield this[$fetch]();
                    }
                }
                return this[_as];
            });
        }).set(function set(value) {
            if (value instanceof association.foreignModel)
                this[_as] = value;
            this[localField] = value;
        });
        this.virtual($as).get(function get() {
            return this[_as];
        });
        this.methods[$fetch] = function fetch() {
            return association.findFor(this);
        };
        this.methods[$unset] = function unset() {
            delete this[_as];
            return this;
        };
    }
    polymorphic(foreignModelNames = [], options = {}, schemaOptions = {}) {
        if (!this.associations)
            this.associations = new Associations_1.Associations(this);
        const association = this.associations.add('polymorphic', _.merge({}, options, { foreignModelNames }));
        this.definePolymorphicSchema(association, schemaOptions);
        this.definePolymorphicVirtual(association);
        return association;
    }
    definePolymorphicSchema({ foreignModelNames, localField, typeField }, schemaOptions = {}) {
        _.merge(schemaOptions, { type: ObjectId });
        const schema = {};
        schema[localField] = schemaOptions;
        schema[typeField] = {
            type: String,
            enum: foreignModelNames
        };
        this.add(schema);
    }
    definePolymorphicVirtual(association) {
        const { as, _as, $as, localField, typeField, $fetch, $unset } = association;
        this.virtual(as).get(function get() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._doc[localField])
                    return null;
                if (!Object.prototype.hasOwnProperty.call(this, _as))
                    this[_as] = yield this[$fetch]();
                return this[_as];
            });
        }).set(function set(value) {
            this[typeField] = value.constructor.modelName;
            this[localField] = value._id;
            this[_as] = value;
        });
        this.virtual($as).get(function get() {
            return this[_as];
        });
        this.methods[$fetch] = function fetch() {
            return association.findFor(this);
        };
        this.methods[$unset] = function unset() {
            delete this[_as];
            return this;
        };
    }
    hasOne(foreignModelName, options = {}) {
        if (!this.associations)
            this.associations = new Associations_1.Associations(this);
        const association = this.associations.add('hasOne', _.merge({}, options, { foreignModelName }));
        this.defineHasOneVirtual(association);
        return association;
    }
    defineHasOneVirtual(association) {
        const { as, _as, $as, $fetch, $unset } = association;
        this.virtual(as).get(function get() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!Object.prototype.hasOwnProperty.call(this, _as))
                    this[_as] = yield this[$fetch]();
                return this[_as];
            });
        });
        this.virtual($as).get(function get() {
            return this[_as];
        });
        this.methods[$fetch] = function fetch() {
            return association.findFor(this);
        };
        this.methods[$unset] = function unset() {
            delete this[_as];
            return this;
        };
    }
    hasMany(foreignModelName, options = {}) {
        if (!this.associations)
            this.associations = new Associations_1.Associations(this);
        const association = this.associations.add('hasMany', _.merge({}, options, { foreignModelName }));
        this.defineHasManyVirtual(association);
        return association;
    }
    defineHasManyVirtual(association) {
        const { as, _as, $as, $fetch, $unset } = association;
        this.virtual(as).get(function get() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!Object.prototype.hasOwnProperty.call(this, _as))
                    this[_as] = yield this[$fetch]();
                return this[_as];
            });
        });
        this.methods[$fetch] = function fetch() {
            return association.findFor(this).collectAssociation({
                document: this,
                association
            });
        };
        this.virtual($as).get(function get() {
            if (this[_as])
                return this[_as];
            return (this[_as] = Collection_1.Collection.collect([], {
                association,
                document: this,
            }));
        });
        this.methods[$unset] = function unset() {
            delete this[_as];
            return this;
        };
    }
    static apply(originalClass) {
        const mixinStaticMethods = Object.getOwnPropertyDescriptors(this.prototype);
        Object.keys(mixinStaticMethods).forEach(methodName => {
            if (methodName !== 'constructor') {
                const method = mixinStaticMethods[methodName];
                Object.defineProperty(originalClass.prototype, methodName, method);
            }
        });
    }
}
exports.SchemaMixin = SchemaMixin;
