import * as mongoose from 'mongoose';
import { Fields } from './Fields';
declare module 'mongoose' {
    interface Document {
        [property: string]: any;
    }
}
export declare class Serializer {
    document: mongoose.Document;
    fields: Fields;
    _properties: string[];
    ['constructor']: typeof Serializer;
    static readonly Model: mongoose.Model<any>;
    readonly Model: mongoose.Model<any>;
    static readonly properties: string[];
    static readonly computed: string[];
    static readonly associations: string[];
    constructor(document: mongoose.Document, ...fields: string[]);
    readonly isLean: number;
    readonly properties: string[];
    readonly associations: string[];
    Serializer(modelName: string): any;
    toJson(json: any): any;
}
//# sourceMappingURL=Serializer.d.ts.map