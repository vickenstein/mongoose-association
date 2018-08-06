"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Association_1 = require("./associations/Association");
class Hydrator {
    static hydrate(documents, hydrateOptions) {
        const { model } = hydrateOptions;
        const nestedFields = [];
        Object.keys(hydrateOptions).forEach((field) => {
            if (field !== 'model' && field !== 'reset')
                nestedFields.push(field);
        });
        const hydratedDocuments = documents.map(document => model.hydrate(document));
        nestedFields.forEach((field) => {
            const nestedModel = hydrateOptions[field].model;
            const cacheField = Association_1.Association.cacheKey(field);
            documents.forEach((document, index) => {
                const fieldDocument = document[field];
                if (fieldDocument instanceof Array) {
                    const nestedDocuments = fieldDocument
                        .map(nestedDocument => nestedModel.hydrate(nestedDocument));
                    hydratedDocuments[index][cacheField] = nestedDocuments;
                }
                else {
                    hydratedDocuments[index][cacheField] = nestedModel.hydrate(fieldDocument);
                }
            });
        });
        return hydratedDocuments;
    }
}
exports.Hydrator = Hydrator;
