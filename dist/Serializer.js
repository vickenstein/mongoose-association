"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Fields_1 = require("./Fields");
const node_association_1 = require("node-association");
class Serializer {
    constructor(document, ...fields) {
        this.document = document;
        //@ts-ignore werid syntax need to fix
        this.fields = (fields[0] instanceof Fields_1.Fields) ? fields[0] : new Fields_1.Fields(...fields);
    }
    static get Model() {
        return undefined;
    }
    get Model() {
        return this.constructor.Model;
    }
    static get properties() {
        return ['id'];
    }
    static get computed() {
        return [];
    }
    static get associations() {
        return [];
    }
    static getPopulatableAssociations(...fields) {
        //@ts-ignore werid syntax need to fix
        const populateFields = (fields[0] instanceof Fields_1.Fields) ? fields[0] : new Fields_1.Fields(...fields);
        const populatableFields = [];
        populateFields.fields.forEach((field) => {
            const populatableField = this.getPopulatableAssociation(field);
            if (populatableField)
                populatableFields.push(populatableField);
        });
        //@ts-ignore werid syntax need to fix
        return (new Fields_1.Fields(...populatableFields)).fields;
    }
    static getPopulatableAssociation(field) {
        const populatableFields = [];
        let serializer = this;
        field.split('.').some(subfield => {
            if (_.includes(serializer.associations, subfield)) {
                const association = serializer.Model.associate(subfield);
                serializer = this.prototype.Serializer(association.foreignModelName);
                populatableFields.push(subfield);
                return false;
            }
            return true;
        });
        return populatableFields.join('.');
    }
    get isLean() {
        return this.properties.length;
    }
    get properties() {
        if (!this._properties) {
            this._properties = _.intersection(this.fields.root, this.constructor.properties);
        }
        return this._properties;
    }
    get associations() {
        return _.intersection(this.fields.root, this.constructor.associations);
    }
    Serializer(modelName) {
        return node_association_1.ClassFinder.classFor(modelName, 'Serializer');
    }
    toJson(json) {
        if (!json)
            return json;
        if (!this.document)
            return this.document;
        if (!this.isLean) {
            this.constructor.properties.forEach(property => {
                json[property] = this.document[property];
            });
        }
        else {
            this.properties.forEach(property => {
                json[property] = this.document[property];
            });
        }
        this.associations.forEach((as) => {
            const association = this.Model.associate(as);
            const nestedDocument = this.document[association._as];
            if (!nestedDocument)
                return null;
            const NestedSerializer = this.Serializer(association.foreignModelName);
            if (nestedDocument instanceof Array) {
                const childrenFields = this.fields.children(as);
                json[association.as] = nestedDocument.map(aNestedDocument => ({}));
                json[association.as].forEach((nestedJson, index) => {
                    const nestedSerializer = new NestedSerializer(nestedDocument[index], childrenFields);
                    nestedSerializer.toJson(nestedJson);
                });
            }
            else {
                json[association.as] = {};
                const nestedSerializer = new NestedSerializer(nestedDocument, this.fields.children(as));
                nestedSerializer.toJson(json[association.as]);
            }
        });
        return json;
    }
}
exports.Serializer = Serializer;
