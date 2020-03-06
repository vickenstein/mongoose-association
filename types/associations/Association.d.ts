import * as mongoose from 'mongoose';
export interface IOptions {
    foreignModelName?: string;
    foreignModelNames?: string;
    as?: string;
    localField?: string;
    with?: string;
    through?: string;
    throughAs?: string;
    throughWith?: string;
    typeField?: string;
    dependent?: string;
    nested?: boolean;
}
export interface IAggregateOptions {
    documents?: any;
    $match?: object;
    hydrate?: boolean;
    as?: string;
    scopeAs?: string;
    preserveNullAndEmptyArrays?: boolean;
}
export declare class Association {
    schema: mongoose.Schema;
    foreignModelName: string;
    through: string;
    typeField: string;
    withAssociation: Association;
    throughAssociation: Association;
    throughAsAssociation: Association;
    throughModel: mongoose.Model<any>;
    isReference: boolean;
    dependent: string;
    nested: boolean;
    ['constructor']: typeof Association;
    static findOne({ modelName, localField, localFieldValue, typeField, type }: {
        modelName: string;
        localField: string;
        localFieldValue: any;
        typeField?: string;
        type?: string;
    }): mongoose.DocumentQuery<any, any>;
    static find({ modelName, localField, localFieldValue, typeField, type }: {
        modelName: string;
        localField: string;
        localFieldValue: string[];
        typeField?: string;
        type?: string;
    }): mongoose.DocumentQuery<any, any>;
    constructor(options: IOptions, schema: mongoose.Schema);
    static readonly options: string[];
    static cacheKey(string: string): string;
    static variablize(string: string): string;
    static idlize(string: string): string;
    static decapitalize(string: string): string;
    static capitalize(string: string): string;
    static readonly isReference: boolean;
    static readonly query: typeof Association.findOne;
    options: any;
    define(property: string, value: any): any;
    readonly associationType: string;
    readonly model: any;
    readonly modelName: any;
    readonly localField: any;
    readonly foreignField: any;
    readonly collectionName: any;
    readonly foreignModel: any;
    readonly foreignCollectionName: any;
    readonly as: any;
    readonly $fetch: any;
    readonly $unset: any;
    readonly _as: any;
    readonly $as: any;
    readonly with: any;
    readonly _with: any;
    readonly $with: any;
    readonly $localField: any;
    readonly $foreignField: any;
    findFor(document: any, options?: any): any;
    findForMany(documents: any, options?: any): any;
    generateAggregateOnModel(options?: IAggregateOptions): any;
    aggregateMatch(options: IAggregateOptions): any;
    aggregate(options?: IAggregateOptions): mongoose.Aggregate<any>;
    aggregateTo(aggregate: mongoose.Aggregate<any>, options?: IAggregateOptions): mongoose.Aggregate<any>;
    aggregateLookUpMatch(options?: IAggregateOptions): {
        $expr: {
            $eq: any[];
        };
    };
    aggregateLookUp(aggregate: mongoose.Aggregate<any>, options?: IAggregateOptions): void;
}
//# sourceMappingURL=Association.d.ts.map