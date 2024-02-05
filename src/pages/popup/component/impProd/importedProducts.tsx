import { useContext } from 'react';
import { ImpProdContext } from '../../tabs/impProdContextProvider';
import { CircularButton } from './circularButton';
import { HoverArrow } from './hoverArrowLogics';

const Footer = ({ clearListHandler, RestoreListHandler }) => {
    return (
        <div className="fixed bottom-0 left-0 w-full bg-gray-900 p-2 flex justify-end">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md mx-2" onClick={clearListHandler}>
                Clear Lists
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded-md mx-2" onClick={RestoreListHandler}>
                Restore
            </button>
        </div>
    );
};

export const ImportedProducts = () => {
    const { clearListHandler, loading, products, setSuccessEntry } = useContext(ImpProdContext);

    return (
        <>
            {loading ? (
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-blue-500 border-r-2 border-b-2"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-white-800 h-[calc(100vh-4.5em)] justify-center items-center mx-4">
                    <ul className="divide-y divide-white-100 pb-16">
                        {products.map(
                            ({
                                orderId,
                                product_main_title,
                                selected_product_variant,
                                bought_price,
                                bought_quantity,
                                product_web_link,
                                product_image_url,
                                product_create_date,
                                buyertrade_tracking_info: { expressId, expressName },
                                freight_delivery_data: {
                                    tracking_code,
                                    delivery_status_tracklink,
                                    date_added,
                                    total_weight,
                                    total_price,
                                    delivery_status,
                                },
                            }: ProductData) => (
                                <li key={product_create_date} className="relative flex justify-between gap-x-4 pt-2 pb-4">
                                    <div className="flex min-w-0 gap-x-4 h-full">
                                        <div className="image_and_status flex w-20 flex-col items-center">
                                            <img className="h-12 w-12 bg-gray-500 mb-2" src={product_image_url} alt="" />
                                            {(delivery_status.toLowerCase() === 'none' && (
                                                <span className="status-indicator bg-red-500 text-white p-1.5 rounded-full animate-pulse text-center">
                                                    New Entry
                                                </span>
                                            )) ||
                                                (delivery_status.toLowerCase() === 'on the way' && (
                                                    <span className="status-indicator bg-yellow-400 text-black p-1.5 rounded-full text-center">
                                                        {delivery_status}
                                                    </span>
                                                )) ||
                                                (delivery_status.toLowerCase() === 'wait to weight' && (
                                                    <span className="status-indicator bg-yellow-400 text-black p-1.5 rounded-full text-center">
                                                        {delivery_status}
                                                    </span>
                                                )) ||
                                                (delivery_status.toLowerCase() === 'wait for deliver' && (
                                                    <span className="status-indicator bg-orange-500 text-white p-1.5 rounded-full text-center">
                                                        {delivery_status}
                                                    </span>
                                                )) ||
                                                (delivery_status.toLowerCase() === 'delivery' && (
                                                    <span className="status-indicator bg-green-500 text-white p-1.5 rounded-full text-center">
                                                        {delivery_status}
                                                    </span>
                                                ))}
                                        </div>
                                        <div className="description min-w-0 flex-auto overflow-visible group relative" onMouseOver={() => setSuccessEntry(null)}>
                                            <p className="text-sm font-semibold leading-6 text-white-900 z-10 relative">
                                                {product_main_title}
                                            </p>
                                            <p className="mb-2 text-xs leading-5 text-white-900 z-10 relative">{selected_product_variant}</p>
                                            {expressId && (
                                                <span className="bg-blue-400 text-white p-1.5 rounded-full text-center z-2 relative">{`${expressName}: ${expressId}`}</span>
                                            )}
                                            <HoverArrow orderId={orderId} />
                                        </div>
                                    </div>

                                    <div className="shrink-0 sm:flex sm:flex-col sm:items-end">
                                        <p className="text-sm leading-6 text-gray-900">Buttons</p>
                                        <div className="mt-1 flex items-center gap-x-1.5">
                                            <CircularButton icon="-" bgColor="blue" orderId={orderId} isMinus={true} />
                                            <CircularButton icon="+" bgColor="blue" orderId={orderId} />
                                        </div>
                                    </div>
                                </li>
                            ),
                        )}
                    </ul>
                </div>
            )}
            <Footer clearListHandler={clearListHandler} RestoreListHandler="" />
        </>
    );
};
