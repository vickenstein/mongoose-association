import * as mongoose from 'mongoose';
import { Has } from './Has';
export declare class HasMany extends Has {
    static readonly options: string[];
    static readonly query: any;
    readonly associationType: any;
    readonly as: any;
    readonly throughWith: any;
    readonly localField: any;
    findFor(document: any): any;
    findManyFor(documents: any[]): any;
    findNestedFor(document: any): mongoose.DocumentQuery<any, any>;
    findManyNestedFor(documents: any[]): mongoose.DocumentQuery<any, any>;
}
//# sourceMappingURL=HasMany.d.ts.map