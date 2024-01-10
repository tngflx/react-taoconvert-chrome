export const ButtonComponent = ({ onClick }) => (
    <div className="tao_convert_button">
        <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
            onClick={onClick}
        >
            TaoConv Import
        </button>
    </div>
);