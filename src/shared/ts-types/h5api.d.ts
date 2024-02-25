interface SkuInfo {
    logisticsTime: string;
    moreQuantity: string;
    price: {
        priceActionText: string;
        priceActionType: string;
        priceMoney: string;
        priceText: string;
    };
    quantity: string;
    quantityText: string;
}

interface Sku2Info {
    [key: string]: SkuInfo;
}

interface UrlParamData {
    id?: string;
    detail_v: string;
    exParams: string; // Assuming exParams is a JSON string
}
interface ReviewDataType {
    revPicPathList: string[];
    reviewDate: string;
    skuText: string;
    reviewWordContent: string;
    reviewAppendVO?: {
        appendedWordContent: string;
        reviewPicPathList: string[];
    };
}