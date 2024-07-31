import { useContext, useState } from 'react';
import { ImpProdContext } from '../../tabs/impProdContextProvider';
import { CircularButton } from './circularButton';
import { HoverArrow } from './hoverArrowLogics';
import * as Form from '@radix-ui/react-form';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
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
interface StatusIndicatorsProps {
    deliveryStatus?: string;
    company?: string;
}

const StatusIndicators: React.FC<StatusIndicatorsProps> = ({ deliveryStatus, company }) => {
    const statusColors = {
        none: 'bg-red-500',
        'arrived': 'bg-purple-500 text-white',
        'on the way': 'bg-violet-500 text-black',
        'wait to weight': 'bg-violet-500 text-white',
        'wait for payment': 'bg-red-300 text-black',
        'wait for deliver': 'bg-violet-500 text-white',
        delivery: 'bg-emerald-500 text-white',
    };

    const companyColors = {
        mulupost: 'bg-indigo-300',
        nswex: 'bg-lime-400',
    };

    const matchedStatus = Object.keys(statusColors).find((key) => deliveryStatus?.toLowerCase()?.includes(key));
    const statusBgColorClass = statusColors[matchedStatus] || 'bg-gray-500 text-white';
    const companyBgColorClass = companyColors[company?.toLowerCase()] || 'bg-gray-500 text-white';

    return (
        <>
            {deliveryStatus && (
                <span className={`status-indicator p-1.5 rounded-full text-center ${statusBgColorClass}`}>
                    {deliveryStatus === 'none' ? 'New Entry' : deliveryStatus.replace(':', ': ')}
                </span>
            )}
            {company && (
                <span className={`status-indicator p-1.5 rounded-full text-center mr-2 ${companyBgColorClass}`}>
                    {company}
                </span>
            )}
        </>
    );
};

export const ImportedProducts = () => {
    const { clearListHandler, loading, products, setSuccessEntry } = useContext(ImpProdContext);
    const [searchTerm, setSearchTerm] = useState('');

    function getSearchScore(field: string, searchTerm: string): number {
        const fieldLower = field.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        if (fieldLower === searchLower) return 3;
        if (fieldLower.startsWith(searchLower)) return 2;
        if (fieldLower.includes(searchLower)) return 1;
        return 0;
    }

    const filteredProducts = searchTerm.trim() === ''
        ? products
        : products.filter((product) => {
            const searchableFields = [
                product.orderId,
                product.product_main_title,
                product.product_create_date,
                product.buyertrade_tracking_info.expressId
            ];

            const totalScore = searchableFields.reduce((score, field) =>
                score + getSearchScore(field?.toString() || '', searchTerm), 0);

            return totalScore > 0;
        });
    return (
        <>
            <Form.Root className="my-2">
                <Form.Field name="search">
                    <div className="flex items-center">
                        <Form.Control asChild>
                            <input
                                className="w-full px-3 py-2 text-sm leading-5 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                type="search"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoComplete="off"
                            />
                        </Form.Control>
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 -ml-8" />
                    </div>
                </Form.Field>
            </Form.Root>

            {loading ? (
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-blue-500 border-r-2 border-b-2"></div>
                </div>
            ) : (
                <ul className="divide-y divide-white-100 pb-16">
                    {filteredProducts.map(
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
                            freight_delivery_data
                        }: ProductData) => {
                            const {
                                company = '',
                                tracking_code,
                                delivery_status_tracklink,
                                date_added,
                                total_weight,
                                total_price,
                                delivery_status,
                            } = freight_delivery_data || {};

                            return (
                                <li key={product_create_date} className="relative flex justify-between gap-x-4 pt-2 pb-4">
                                    <div className="flex min-w-0 gap-x-4 h-full">
                                        <div className="image_and_status flex w-20 flex-col items-center">
                                            <img className="h-12 w-12 bg-gray-500 mb-2" src={product_image_url} alt="" />
                                            <StatusIndicators deliveryStatus={delivery_status} />
                                        </div>
                                        <div className="description min-w-0 flex-row group relative" onMouseOver={() => setSuccessEntry(null)}>
                                            <p className="text-sm font-semibold leading-6 text-white-900 z-10 relative">
                                                {product_main_title}
                                            </p>
                                            <p className="mb-2 text-xs leading-5 text-white-900 z-10 relative">{selected_product_variant}</p>
                                            <StatusIndicators company={company} />
                                            {expressId && (
                                                <span className="bg-blue-400 text-white p-1.5 rounded-full text-center z-2 relative">{`${expressName}: ${expressId}`}</span>
                                            )}
                                            <HoverArrow orderId={orderId} freightCompany={company?.toLowerCase()} />
                                        </div>
                                    </div>

                                    <div className="shrink-0 sm:flex sm:flex-col sm:items-end">
                                        <p className="text-sm leading-6 text-gray-900">Buttons</p>
                                        <div className="mt-1 flex items-center gap-x-1.5">
                                            <CircularButton icon="-" bgColor="blue" orderId={orderId} isMinus />
                                            <CircularButton icon="+" bgColor="blue" orderId={orderId} />
                                        </div>
                                    </div>
                                </li>
                            );
                        }
                    )}
                </ul>
            )}
            <Footer clearListHandler={clearListHandler} RestoreListHandler="" />
        </>
    );
};
