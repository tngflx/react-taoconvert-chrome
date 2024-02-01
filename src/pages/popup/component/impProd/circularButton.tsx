import { idb } from "../../../../shared/storages/indexDB";
import { useImpProdContext } from "../../tabs/impProdContextProvider";

interface CircularButtonProps {
    icon: string;
    bgColor: string;
    hoverBgColor: string;
    orderId: any;
    isMinus?: boolean;  // Make isMinus optional
    onClick?: (orderId: any) => void;
}

export const CircularButton: React.FC<any> = ({ onClick, icon, bgColor, hoverBgColor, orderId, isMinus }) => {
    const { fetchDB } = useImpProdContext()

    const colors = {
        red: 'bg-red-300',
        blue: 'bg-blue-600',
        green: 'bg-green-500'
    };

    const handleMinusClick = () => {
        console.log(orderId);
        idb.remove(orderId);
        fetchDB()
    };

    const handlePlusClick = () => {
       
    };

    const handleClick = () => {
        if (isMinus) {
            handleMinusClick();
        } else {
            handlePlusClick();
        }

        // You can call the provided onClick prop if needed
        if (onClick) {
            onClick(orderId);
        }
    };

    return (
        <button
            className={`w-8 h-8 ${colors[bgColor]} text-white rounded-full flex items-center justify-center hover:bg-red-300 focus:shadow-outline-${colors[bgColor]} active:${bgColor}`}
            onClick={handleClick}
        >
            <span className="text-2xl">{icon}</span>
        </button>
    );
};