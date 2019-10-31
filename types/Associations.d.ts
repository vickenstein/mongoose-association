import * as mongoose from 'mongoose';
import { SchemaMixin } from './SchemaMixin';
import { Association } from './associations/Association';
import { Scope } from './associations/Scope';
interface IasIndex {
    [as: string]: Association | Scope;
}
export declare class Associations {
    schema: SchemaMixin;
    asIndexed: IasIndex;
    static readonly types: string[];
    static classOf(type: string): any;
    constructor(schema: SchemaMixin);
    associate(as: string): Association | Scope;
    readonly model: mongoose.Model<any>;
    readonly modelName: string;
    readonly collectionName: string;
    add(type: string, options: object): Association;
    index(association: Association): Association;
    indexScope(scope: Scope): Scope;
    forEach(func: (association: Association | Scope) => void): void;
}
export {};
//# sourceMappingURL=Associations.d.ts.map