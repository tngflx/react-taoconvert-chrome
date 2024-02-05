interface TrackingInfo {
    expressId: string;
    expressName: string;
    // Add other properties if necessary
}

interface BuyerTradeData {
    orderId: string;
    product_main_title: string | null;
    selected_product_variant: string | null;
    bought_price: string | null;
    bought_quantity: string | null;
    product_web_link: string | null;
    product_image_url: string | null;
    product_create_date: string | null;
    buyertrade_tracking_info: TrackingInfo | null;
}
interface ProductData {
    orderId: string;
    product_main_title: string;
    selected_product_variant: string;
    bought_price: number;
    bought_quantity: number;
    product_web_link: string;
    product_image_url: string;
    product_create_date: string;
    buyertrade_tracking_info: TrackingInfo; // or replace with a specific type for tracking_info
    freight_delivery_data: {
        tracking_code: string;
        delivery_status_tracklink: string;
        date_added: string;
        total_weight: number;
        total_price: number;
        delivery_status: string;
    };
}