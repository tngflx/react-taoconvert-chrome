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