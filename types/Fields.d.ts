export declare class Fields {
    private fields;
    _root: string[];
    constructor(options?: object, ...fields: string[]);
    static reduce(...fields: string[]): string[];
    readonly length: number;
    readonly root: string[];
    children(matchField: string): Fields;
    filter(filterFields: string[]): string[];
}
//# sourceMappingURL=Fields.d.ts.map