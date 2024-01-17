interface IDBAccess {
    instance: IDBAccess;
    connect(dbName: string, storeName: string): Promise<IDBDatabase>;
}


interface IRead<T> {
    retrieve(): Promise<T[]>;
    get(orderId: string): Promise<T>;
}

interface IWrite<T> {
    add(item: T): Promise<T>;
    update(item: T): Promise<T>;
    remove(orderId: string): Promise<T>;
}
interface IDataAccess<T extends Item> extends IRead<T>, IWrite<T> { }

export class Item {
    orderId: string
    product_main_title: string
    product_selected_title: string
    bought_price: number
    bought_quantity: number
    product_web_link: string
    product_image_url: string
    product_create_time: number
}
export class DBAccess implements IDBAccess {
    private dbAccess: DBAccess;
    private db: IDBDatabase;

    async connect(dbName: string, storeName: string) {

        if (this.db) {
            return this.db;
        }

        let attempts = 3;
        const request = indexedDB.open(dbName, 1);

        return new Promise<IDBDatabase>((resolve, reject) => {
            request.onerror = error => {
                attempts--;
                if (attempts) {
                    return this.connect(dbName, storeName);
                }
                return reject(error);
            }
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            request.onupgradeneeded = () => {
                this.db = request.result;
                request.result.createObjectStore(storeName, { keyPath: 'orderId' });
                resolve(this.db);
            }
        });

    }

    get instance() {
        return this.dbAccess ? this.dbAccess : this.dbAccess = new DBAccess();
    }
}

class DataAccess<T extends Item> implements IDataAccess<T> {
    private connection: Promise<IDBDatabase>;

    constructor(dbName: string, private storeName: string) {
        this.connection = new DBAccess().connect(dbName, storeName);
    }

    async add(item: T) {
        const db = await this.connection;
        const request = db.transaction([this.storeName], 'readwrite')
            .objectStore(this.storeName)
            .add(item);

        return this.requestHandler(request);
    }

    async retrieve() {
        const db = await this.connection;
        const store = db.transaction([this.storeName], 'readonly')
            .objectStore(this.storeName);

        return new Promise<T[]>((resolve, reject) => {
            const result: any[] = [];
            store.openCursor().onsuccess = event => {
                const cursor = (event.target as any).result;
                if (cursor) {
                    result.push(cursor.value);
                    cursor.continue();
                }
                else {
                    return resolve(result);
                }
            };
        });
    }

    async update(item: T) {
        const db = await this.connection;
        const request = db.transaction([this.storeName], 'readwrite')
            .objectStore(this.storeName)
            .put(item);

        return this.requestHandler(request);
    }

    async get(orderId: string) {
        const db = await this.connection;
        const request = db.transaction([this.storeName], 'readonly')
            .objectStore(this.storeName)
            .get(orderId);

        return this.requestHandler(request);
    }

    async remove(orderId: string) {
        const db = await this.connection;
        const request = db.transaction([this.storeName], 'readwrite')
            .objectStore(this.storeName)
            .delete(orderId);

        return this.requestHandler(request);
    }

    async clear() {
        const db = await this.connection;
        const request = db.transaction([this.storeName], 'readwrite')
            .objectStore(this.storeName)
            .clear();

        return this.requestHandler(request);
    }

    private requestHandler(request: IDBRequest) {
        return new Promise<T>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.result);
        });
    }
}

export const idb = new DataAccess<Item>('saved_list_db', 'saved_lists');
