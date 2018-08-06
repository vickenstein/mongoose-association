"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Association_1 = require("./Association");
const OPTIONS = { localField: 'name of the property to store the reference id' };
class BelongsTo extends Association_1.Association {
    static get options() {
        return Object.keys(OPTIONS).concat(Association_1.Association.options);
    }
    constructor(options, schema) {
        if (!options.foreignModelName) {
            throw 'Can\'t create a belongsTo association without specifying a foreignModelName';
        }
        super(options, schema);
    }
    get associationType() {
        return this.define('associationType', 'belongsTo');
    }
    findFor(document) {
        if (document instanceof Array) {
            return this.findManyFor(document);
        }
        return BelongsTo.findOne({
            modelName: this.foreignModelName,
            localField: '_id',
            localFieldValue: document[this.localField],
        });
    }
    findManyFor(documents) {
        return BelongsTo.find({
            modelName: this.foreignModelName,
            localField: '_id',
            localFieldValue: documents.map(document => document[this.localField]),
        });
    }
    index(order, options) {
        this.schema.indexAssociations([this, order], options);
        return this;
    }
}
exports.BelongsTo = BelongsTo;
