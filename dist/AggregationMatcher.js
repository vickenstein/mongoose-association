"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Association_1 = require("./associations/Association");
class AggregationMatcher {
    constructor(aggregate, match = {}) {
        this.aggregate = aggregate;
        this.processPipeline(match);
    }
    static match(pipeline) {
        for (let i = 0; i < pipeline.length; i++) {
            const step = pipeline[i];
            if (step.$match)
                return step;
        }
    }
    static lookups(pipeline) {
        return pipeline.filter((step) => {
            return step && step.$lookup;
        });
    }
    get pipeline() {
        return this.aggregate._pipeline;
    }
    get modelName() {
        return Association_1.Association.decapitalize(this.aggregate._model.modelName);
    }
    get match() {
        return this.constructor.match(this.pipeline);
    }
    lookup(as) {
        for (let i = 0; i < this.pipeline.length; i++) {
            const step = this.pipeline[i];
            if (step.$lookup && step.$lookup.as === as)
                return [step, i];
        }
        return [null, null];
    }
    updateLookup(as, match) {
        const [step, index] = this.lookup(as);
        if (step) {
            const localMatch = this.constructor.match(step.$lookup.pipeline);
            if (localMatch) {
                _.merge(localMatch.$match, match);
            }
        }
    }
    updateMatch(match) {
        const localMatch = this.match;
        if (localMatch) {
            _.merge(localMatch.$match, match);
        }
        else {
            this.pipeline.unshift({
                $match: match
            });
        }
    }
    update(as, match) {
        if (as === this.modelName) {
            this.updateMatch(match);
        }
        else {
            this.updateLookup(as, match);
        }
    }
    processPipeline(match) {
        Object.keys(match).forEach((key) => {
            const localMatch = match[key];
            this.update(key, localMatch);
        });
    }
}
exports.AggregationMatcher = AggregationMatcher;
