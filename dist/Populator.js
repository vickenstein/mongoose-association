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
const Fields_1 = require("./Fields");
const Association_1 = require("./associations/Association");
const ObjectId = mongoose.Types.ObjectId;
class Populator {
    static checkFields(populateFields) {
        if (populateFields[0] && populateFields[0] instanceof Fields_1.Fields) {
            return populateFields[0];
        }
        return new Fields_1.Fields(...populateFields);
    }
    static populate(model, documents, ...populateFields) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(documents instanceof Array))
                documents = [documents];
            if (populateFields[0] instanceof Array)
                [populateFields] = populateFields;
            const fields = this.checkFields(populateFields);
            const rootFields = fields.root;
            yield Promise.all(rootFields.map((rootField) => {
                const childrenFields = fields.children(rootField);
                return this.populateField(model, documents, rootField, childrenFields);
            }));
            return documents;
        });
    }
    static explainPopulate(model, documents, ...populateFields) {
        if (!(documents instanceof Array))
            documents = [documents];
        if (populateFields[0] instanceof Array)
            [populateFields] = populateFields;
        const fields = this.checkFields(populateFields);
        const rootFields = fields.root;
        return _.flatten(rootFields.map((rootField) => {
            const childrenFields = fields.children(rootField);
            return this.explainPopulateField(model, documents, rootField, childrenFields);
        }));
    }
    static populateField(model, documents, field, childrenFields) {
        return __awaiter(this, void 0, void 0, function* () {
            const _field = Association_1.Association.cacheKey(field);
            const association = model.associate(field);
            const results = yield association.findFor(documents).populateAssociation(childrenFields);
            const enumerateMethod = association.associationType === 'hasMany' ? _.groupBy : _.keyBy;
            const { localField } = association;
            let { foreignField } = association;
            if (association.through) {
                foreignField = (document) => document[association.throughAsAssociation._with][foreignField];
            }
            const indexedResults = enumerateMethod(results, foreignField);
            documents.forEach((document) => {
                document[_field] = indexedResults[document[localField]];
            });
            return documents;
        });
    }
    static explainPopulateField(model, documents, field, childrenFields) {
        const association = model.associate(field);
        return association.findFor(documents).populateAssociation(childrenFields)._explain();
    }
    static prePopulateAggregate(aggregate, ...populateFields) {
        const fields = this.checkFields(populateFields);
        const rootFields = fields.root;
        const model = aggregate._model;
        rootFields.forEach((rootField) => {
            const childrenFields = fields.children(rootField);
            const association = model.associate(rootField);
            association.aggregateTo(aggregate);
            if (childrenFields.length) {
                const options = {};
                options[rootField] = childrenFields;
                aggregate.populateAssociation(options);
            }
        });
    }
    static populateAggregate(model, documents, populateOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const populateFields = Object.keys(populateOptions);
            const promises = [];
            populateFields.forEach(field => {
                if (field !== '_fields') {
                    const _field = Association_1.Association.cacheKey(field);
                    const nestedDocuments = _.compact(_.flatten(documents.map((document) => document[_field])));
                    if (nestedDocuments.length) {
                        promises.push(this.populate(nestedDocuments[0].constructor, nestedDocuments, populateOptions[field]));
                    }
                }
            });
            yield Promise.all(promises);
            return documents;
        });
    }
    static explainPopulateAggregate(model, documents, populateOptions = {}) {
        let explain = [];
        Object.keys(populateOptions).forEach(field => {
            if (field !== '_fields') {
                const association = model.associate(field);
                const { foreignModel } = association;
                explain = explain.concat(this.explainPopulate(foreignModel, [foreignModel._explain()], populateOptions[field]));
            }
        });
        return explain;
    }
    static queryConditionToAggregateMatch(conditions) {
        Object.keys(conditions).forEach(key => {
            const value = conditions[key];
            if (ObjectId.isValid(value))
                return (conditions[key] = ObjectId(value));
            if (value instanceof Array) {
                if (ObjectId.isValid(value[0])) {
                    conditions[key] = { $in: value.map((aValue) => ObjectId(aValue)) };
                }
                else {
                    conditions[key] = { $in: value };
                }
            }
        });
        return conditions;
    }
    static aggregateFromQuery(query, fields) {
        const aggregate = query.model.aggregate()
            .match(this.queryConditionToAggregateMatch(query._conditions));
        if (query.op === 'findOne')
            aggregate.limit(1).singular();
        fields.root.forEach((field) => {
            const association = query.model.associate(field);
            association.aggregateTo(aggregate);
            const children = fields.children(field);
            if (children.length) {
                const options = {};
                options[field] = children;
                aggregate.populateAssociation(options);
            }
        });
        aggregate.hydrateAssociation({ model: query.model });
        return aggregate;
    }
}
exports.Populator = Populator;
