import * as mongoose from 'mongoose';
export declare class AggregationMatcher {
    aggregate: mongoose.Aggregate<any>;
    ['constructor']: typeof AggregationMatcher;
    static match(pipeline: any[]): any;
    static lookups(pipeline: any[]): any[];
    constructor(aggregate: mongoose.Aggregate<any>, match?: any);
    readonly pipeline: any[];
    readonly modelName: string;
    readonly match: any;
    lookup(as: string): any[];
    updateLookup(as: string, match: any): void;
    updateMatch(match: any): void;
    update(as: string, match: any): void;
    processPipeline(match: any): void;
}
//# sourceMappingURL=AggregationMatcher.d.ts.map