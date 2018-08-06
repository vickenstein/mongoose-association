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
class Collection extends Array {
    constructor(items) {
        super(...items);
    }
    static collect(documents, options) {
        const array = Object.create(Collection.prototype);
        array._push(...documents);
        array.document = options.document;
        array.association = options.association;
        return array;
    }
    _push(...documents) {
        super.push(...documents);
    }
    pushDocument(...foreignObjects) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.association.through) {
                const { as } = this.association.withAssociation;
                foreignObjects.forEach((foreignObject) => (foreignObject[as] = this.document));
                const condition = { _id: foreignObjects.map(foreignObject => foreignObject._id) };
                const attributes = {};
                Object.keys(foreignObjects[0].$__.activePaths.states.modify).forEach(key => {
                    attributes[key] = foreignObjects[0][key];
                });
                yield foreignObjects[0].constructor.updateMany(condition, attributes);
                foreignObjects.forEach(foreignObject => {
                    foreignObject.$__.activePaths.states.modify = {};
                });
            }
            this._push(...foreignObjects);
            if (this.association.through) {
                const throughAttributes = foreignObjects.map(foreignObject => {
                    const throughAttribute = {};
                    throughAttribute[this.association.throughAsAssociation.as] = foreignObject;
                    throughAttribute[this.association.withAssociation.as] = this.document;
                    return throughAttribute;
                });
                yield this.association.throughModel.create(throughAttributes);
            }
            return foreignObjects.length === 1 ? foreignObjects[0] : foreignObjects;
        });
    }
    create(attributes = {}, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (attributes instanceof Array)
                return this.createMany(attributes, options);
            const model = this.association.foreignModel;
            if (!this.association.through) {
                const { as } = this.association.withAssociation;
                attributes[as] = this.document;
            }
            const foreignObject = yield model.create(attributes, options);
            this._push(foreignObject);
            if (this.association.through) {
                const throughAttributes = {};
                throughAttributes[this.association.throughAsAssociation.as] = foreignObject;
                throughAttributes[this.association.withAssociation.as] = this.document;
                yield this.association.throughModel.create(throughAttributes);
            }
            return foreignObject;
        });
    }
    createMany(attributes = [], options) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.association.foreignModel;
            if (!this.association.through) {
                attributes.forEach(attribute => {
                    const { as } = this.association.withAssociation;
                    attribute[as] = this.document;
                });
            }
            const foreignObjects = yield model.create(attributes, options);
            this._push(...foreignObjects);
            if (this.association.through) {
                const throughAttributes = foreignObjects.map(foreignObject => {
                    const throughAttribute = {};
                    throughAttribute[this.association.throughAsAssociation.as] = foreignObject;
                    throughAttribute[this.association.withAssociation.as] = this.document;
                    return throughAttribute;
                });
                yield this.association.throughModel.create(throughAttributes);
            }
            return foreignObjects;
        });
    }
}
