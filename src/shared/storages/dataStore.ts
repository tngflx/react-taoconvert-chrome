import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type RemappedReviewData = [{
    skuText: {
        [key: string]: any
    }
    review_data: any[];
} & Record<string, any>]

type RemappedSkuBase = [];

type CombinedData = {
    remappedReviewData: RemappedReviewData;
    remappedSkuBase: RemappedSkuBase;
    loadState: boolean;
    cookie: any
}

type DataStorage = BaseStorage<CombinedData> & {
    updateRemappedReviewData: (data: RemappedReviewData) => Promise<void>;
    updateRemappedSkuBase: (data: RemappedSkuBase) => Promise<void>;
    setLoadState: (state: boolean) => Promise<void>;
    setCookieData: (data: any) => Promise<void>;
    getLoadState: () => Promise<boolean>;
};

const dataStorage = createStorage<CombinedData>('data-storage-key', {
    remappedReviewData: [{ skuText: {}, review_data: [] }],
    remappedSkuBase: [],
    loadState: false,
    cookie: []
}, {
    storageType: StorageType.Local,
    liveUpdate: true,
});

const internalWorkStorage = createStorage<CombinedData>('internal-work-key', {
    remappedReviewData: [{ skuText: {}, review_data: [] }],
    remappedSkuBase: [],
    loadState: false,
    cookie: []
}, {
    storageType: StorageType.Local,
    liveUpdate: true,
});

const dataStore: DataStorage = {
    ...dataStorage,
    updateRemappedReviewData: (data) => {
        return dataStorage.set(currentData => ({
            ...currentData,
            remappedReviewData: data,
        }));
    },
    updateRemappedSkuBase: (data) => {
        return dataStorage.set(currentData => ({
            ...currentData,
            remappedSkuBase: data,
        }));
    },
    setLoadState: (state) => {
        return internalWorkStorage.set(currentData => ({
            ...currentData,
            loadState: state,
        }));
    },
    setCookieData: (data) => {
        return internalWorkStorage.set(currentData => ({
            ...currentData,
            cookie: data,
        }));
    },
    getLoadState: () => {
        return dataStorage.get().then(currentData => currentData.loadState);
    }
};

export default dataStore;