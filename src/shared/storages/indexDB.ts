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
                const objectStore = request.result.createObjectStore(storeName, { keyPath: 'orderId' });
                objectStore.createIndex('productCreateTimeIndex', 'product_create_date');

                resolve(this.db);
            }
        });

    }

    get instance() {
        return this.dbAccess ? this.dbAccess : this.dbAccess = new DBAccess();
    }
}

class DataAccess<T extends BuyerTradeData> implements IDataAccess<T> {
    private connection: Promise<IDBDatabase>;

    constructor(dbName: string, private storeName: string) {
        this.connection = new DBAccess().connect(dbName, storeName);
    }

    async add(item: T) {
        const db = await this.connection;
        const request = db.transaction([this.storeName], 'readwrite')
            .objectStore(this.storeName)
            .put(item);

        return this.requestHandler(request);
    }

    async retrieve(options: string) {
        const db = await this.connection;
        const store = db.transaction([this.storeName], 'readonly').objectStore(this.storeName);

        let request: IDBRequest;

        if (options == 'sort') {
            // Use the specified index for sorting
            const index = store.index('productCreateTimeIndex');
            request = index.openCursor(null, 'prev');
        } else {
            // Use the default primary key (orderId) for sorting
            request = store.openCursor();
        }

        return new Promise<T[]>((resolve, reject) => {
            const result: any[] = [];

            request.onsuccess = event => {
                const cursor = (event.target as any).result;
                if (cursor) {
                    result.push(cursor.value);
                    cursor.continue();
                } else {
                    return resolve(result);
                }
            };

            request.onerror = event => {
                console.error('Error retrieving data:', event.target.error);
                reject(event.target.error);
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
