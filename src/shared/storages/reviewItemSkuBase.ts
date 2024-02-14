// exampleDataStorage.ts
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type RemappedReviewData = [] ;
type RemappedSkuBase = [] ;

type DataStorage = BaseStorage<{ remappedReviewData: RemappedReviewData; remappedSkuBase: RemappedSkuBase }> & {
    updateRemappedReviewData: (data: RemappedReviewData) => Promise<void>;
    updateRemappedSkuBase: (data: RemappedSkuBase) => Promise<void>;
};

const dataStorage = createStorage<{ remappedReviewData: RemappedReviewData; remappedSkuBase: RemappedSkuBase }>('data-storage-key', {
    remappedReviewData: [],
    remappedSkuBase: [],
}, {
    storageType: StorageType.Local,
    liveUpdate: true,
});

const dataStore: DataStorage = {
    ...dataStorage,
    updateRemappedReviewData: async (data) => {
        await dataStorage.set(currentData => ({
            ...currentData,
            remappedReviewData: data,
        }));
    },
    updateRemappedSkuBase: async (data) => {
        await dataStorage.set(currentData => ({
            ...currentData,
            remappedSkuBase: data,
        }));
    },
};

export default dataStore;
