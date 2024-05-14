import triplearrow from '@assets/img/triplearrow.svg';
import { idb } from '../../../../shared/storages/indexDB';
import cross from '@assets/img/cross.svg';
import tick from '@assets/img/success.svg';
import { useImpProdContext } from '../../tabs/impProdContextProvider';

const HoverArrow = ({ orderId }) => {
  const desiredURL = 'https://nswex.com/index.php?route=account/shipforme';
  const { successEntry, setSuccessEntry } = useImpProdContext();

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { msg_action, isEveryInputFilledFlag, isEveryInputSameFlag } = request;
    const [parent_msg, child_msg] = msg_action.split(':');
    switch (parent_msg) {
      case 'nswex':
        switch (child_msg) {
          case 'update_hoverarrow':
            if (isEveryInputFilledFlag && isEveryInputSameFlag) {
              setSuccessEntry(false);
            } else if (!isEveryInputFilledFlag || !isEveryInputSameFlag) {
              setSuccessEntry(true);
            }

            break;
        }

        break;
      default:
        break;
    }
  });

  const clickHandler = () => {
    chrome.tabs.query({ url: 'https://nswex.com/*' }, async function (tabs) {
      const nswexTab = tabs.length > 0 ? tabs[0] : null;
      const selected_product_infos = await idb.get(orderId);

      if (nswexTab) {
        chrome.runtime.sendMessage({ msg_action: 'popup:update_nswex_tab', url: desiredURL, selected_product_infos, nswexTab });
      } else {
        chrome.runtime.sendMessage({ msg_action: 'popup:create_nswex_tab', url: desiredURL, selected_product_infos });
      }
    });
  };

  return (
    <div
      className="hover-arrow absolute top-0 left-[-15rem] h-full flex-col items-center justify-center z-0 transition-transform duration-950 group-hover:translate-x-[32rem]"
      onClick={clickHandler}>
      {successEntry === true ? (
        <>
          <img src={tick} alt="" className="h-[70px] w-full mb-1 items-center" />
          <p className="text-center text-sm p-[0.5px] rounded-full bg-emerald-300">Success!</p>
        </>
      ) : successEntry === false ? (
        <>
          <img src={cross} alt="" className="h-[70px] w-full mb-1 items-center" />
          <p className="text-center text-sm p-[0.5px] rounded-full bg-red-300">Already Filled!</p>
        </>
      ) : (
        <>
          <img src={triplearrow} alt="" className="h-[70px] w-full mb-1 items-center" />
          <p className="text-center text-sm p-[0.5px] rounded-full bg-orange-300">Export to freight!</p>
        </>
      )}
    </div>
  );
};

export { HoverArrow };
