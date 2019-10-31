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
    constructor(...items) {
        super(...items);
    }
    static collect(documents, options) {
        const array = Object.create(Collection.prototype);
        array._push(...documents);
        array.document = options.document;
        array.association = options.association;
        return array;
    }
    _spliceIn(position, ...documents) {
        super.splice(position, 0, ...documents);
    }
    _spliceOut(position, count) {
        super.splice(position, count);
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
                yield this.association.throughModel.insertMany(throughAttributes);
            }
            return foreignObjects.length === 1 ? foreignObjects[0] : foreignObjects;
        });
    }
    addNestedDocument(options = {}, ...foreignObjects) {
        return __awaiter(this, void 0, void 0, function* () {
            const hasPosition = typeof options.position === 'number';
            const { isSynchronized } = this;
            if (hasPosition) {
                this.document[this.association.localField].splice(options.position, 0, ...foreignObjects);
                if (isSynchronized)
                    this._spliceIn(options.position, ...foreignObjects);
            }
            else {
                this.document[this.association.localField].push(...foreignObjects);
                if (isSynchronized)
                    this._push(...foreignObjects);
            }
            yield this.document.save(options);
            return foreignObjects;
        });
    }
    removeNestedDocument(options, ...foreignObjects) {
        return __awaiter(this, void 0, void 0, function* () {
            // todo: need to add this functionality
        });
    }
    get isSynchronized() {
        // @ts-ignore
        return !this.document[this.association.localField].some((id, index) => {
            // @ts-ignore
            return (this[index] && this[index].id) !== id.toString();
        });
    }
    create(attributes = {}, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (attributes instanceof Array)
                return this.createMany(attributes, options);
            const model = this.association.foreignModel;
            if (!this.association.through && !this.association.nested) {
                const { as } = this.association.withAssociation;
                attributes[as] = this.document;
            }
            const foreignObject = yield model.create(attributes, options);
            if (this.association.nested) {
                yield this.addNestedDocument(options, foreignObject);
            }
            else {
                this._push(foreignObject);
            }
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
            if (!this.association.through && !this.association.nested) {
                attributes.forEach(attribute => {
                    const { as } = this.association.withAssociation;
                    attribute[as] = this.document;
                });
            }
            const foreignObjects = yield model.insertMany(attributes, options);
            if (this.association.nested) {
                yield this.addNestedDocument(options, ...foreignObjects);
            }
            else {
                this._push(...foreignObjects);
            }
            if (this.association.through) {
                const throughAttributes = foreignObjects.map(foreignObject => {
                    const throughAttribute = {};
                    throughAttribute[this.association.throughAsAssociation.as] = foreignObject;
                    throughAttribute[this.association.withAssociation.as] = this.document;
                    return throughAttribute;
                });
                yield this.association.throughModel.insertMany(throughAttributes);
            }
            return foreignObjects;
        });
    }
}
exports.Collection = Collection;
