import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type RemappedReviewData = [];
type RemappedSkuBase = [];

type DataStorage = BaseStorage<{ remappedReviewData: RemappedReviewData; remappedSkuBase: RemappedSkuBase; }> & {
    updateRemappedReviewData: (data: RemappedReviewData) => Promise<void>;
    updateRemappedSkuBase: (data: RemappedSkuBase) => Promise<void>;
};

const dataStorage = createStorage<{
    remappedReviewData: RemappedReviewData; remappedSkuBase: RemappedSkuBase;
}>('data-storage-key', {
    remappedReviewData: [],
    remappedSkuBase: []
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
    }
};


type loadStateType = BaseStorage<boolean> & {
    setLoad: (s: boolean) => Promise<void>;
//    getLoad: () => Promise<boolean>;
};

const loadStore = createStorage<boolean>('load-key', false, {
    storageType: StorageType.Local,
    liveUpdate: true,
});

const loadState: loadStateType = {
    ...loadStore,
    setLoad: loadStore.set,
};

export { loadState }
export default dataStore;
