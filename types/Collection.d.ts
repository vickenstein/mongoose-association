import * as mongoose from 'mongoose';
import { Association } from './associations/Association';
interface IOptions {
    document: mongoose.Document;
    association: Association;
}
export declare class Collection<T> extends Array<T> {
    document: mongoose.Document;
    association: Association;
    private constructor();
    static collect<T>(documents: Array<T>, options: IOptions): Collection<T>;
    _spliceIn(position: number, ...documents: Array<T>): void;
    _spliceOut(position: number, count: number): void;
    _push(...documents: Array<T>): void;
    pushDocument(...foreignObjects: any[]): Promise<any>;
    addNestedDocument(options?: any, ...foreignObjects: any[]): Promise<any[]>;
    removeNestedDocument(options: any, ...foreignObjects: any[]): Promise<void>;
    readonly isSynchronized: boolean;
    synchronize(): Promise<void>;
    create(attributes: any, options: any): Promise<any>;
    createMany(attributes: any[], options: any): Promise<T[]>;
}
export {};
//# sourceMappingURL=Collection.d.ts.map