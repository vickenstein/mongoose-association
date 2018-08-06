import * as mongoose from 'mongoose';
import { Association } from './associations/Association';
interface IasIndex {
    [as: string]: Association;
}
export declare class Associations {
    schema: mongoose.Schema;
    asIndexed: IasIndex;
    static readonly types: string[];
    static classOf(type: string): any;
    constructor(schema: mongoose.Schema);
    associate(as: string): Association;
    readonly model: mongoose.Model<any>;
    readonly modelName: string;
    readonly collectionName: string;
    add(type: string, options: object): Association;
    index(association: Association): Association;
    forEach(func: (association: Association) => void): void;
}
export {};
//# sourceMappingURL=Associations.d.ts.map