interface IDBAccess {
    instance: IDBAccess;
    connect(dbName: string, storeName: string): Promise<IDBDatabase>;
}

interface IRead<T> {
    retrieve(options: string): Promise<T[]>;
    get(orderId: string): Promise<T>;
}

interface IWrite<T> {
    add(item: T): Promise<T>;
    update(item: T): Promise<T>;
    remove(orderId: string): Promise<T>;
}

interface IDataAccess<T extends Item> extends IRead<T>, IWrite<T> { }