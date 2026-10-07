import MainnetConnect from "./MainnetConnect";
import MetamaskConnect from "./MetamaskConnect";
import { chainId } from "../utils/constants";

const EthereumInteraction = ({ wallet, chain, children }) => {
    return (
        <div className="w-full h-full flex flex-col justify-center items-center">
            {wallet ? chain === String(chainId) ? children : <MainnetConnect /> : <MetamaskConnect />}
        </div>
    );
};

export default EthereumInteraction;
