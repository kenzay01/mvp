import { providers, utils } from "ethers";
import { useEffect, useState } from "react";
import { AVALANCHE_MAINNET, chainId } from "./constants";

export const _isMetaMaskInstalled = () => {
  if (typeof window === "undefined") return;
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};

export const _getProvider = () => {
  if (!_isMetaMaskInstalled()) return null;
  return new providers.Web3Provider(window.ethereum);
};

export const _getChain = async () => {
  const provider = _getProvider();
  if (!provider) return -1;
  return `${(await provider.getNetwork()).chainId}`;
};

const _onAccountsChanged = (callback) => {
  if (!_isMetaMaskInstalled()) return;
  window.ethereum.on("accountsChanged", callback);
};

const _onChainChanged = (callback) => {
  if (!_isMetaMaskInstalled()) return;
  window.ethereum.on("chainChanged", callback);
};

export const _getAddress = async () => {
  const provider = _getProvider();
  if (!provider) return null;
  try {
    const accounts = await provider.listAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  } catch (e) {
    return null;
  }
};

export const WalletHook = () => {
  const [wallet, setWallet] = useState(null);
  const [chain, setChain] = useState(-1);

  useEffect(() => {
    const load = async () => {
      try {
        setWallet((await _getAddress())?.toLowerCase());
        setChain(await _getChain());
      } catch (error) {
        return error;
      }
    };

    _onAccountsChanged((_address) => {
      if (!_address[0]) return;
      setWallet(_address[0].toLowerCase());
    });
    _onChainChanged((_chain) => {
      if (!_chain) return;
      setChain(`${parseInt(_chain)}`);
    });
    load();
  }, []);

  return {
    wallet,
    chain,
  };
};

export const connectMetamask = async () => {
  if (!_isMetaMaskInstalled()) return false;
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts.length) return false;
    return await switchToMainnet();
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const switchToMainnet = async () => {
  if (!_isMetaMaskInstalled()) return false;
  const provider = window.ethereum;
  try {
    const currentChain = await provider.request({ method: "eth_chainId" });
    if (parseInt(currentChain, 16) === chainId) return true;

    const switchRequest = {
      method: "wallet_switchEthereumChain",
      params: [{ chainId: AVALANCHE_MAINNET.chainId }],
    };

    try {
      await provider.request(switchRequest);
    } catch (error) {
      const isUnknownChain = Number(error.code) === 4902 ||
        Number(error.data?.originalError?.code) === 4902;
      if (!isUnknownChain) throw error;

      await provider.request({
        method: "wallet_addEthereumChain",
        params: [AVALANCHE_MAINNET],
      });
      await provider.request(switchRequest);
    }

    const activeChain = await provider.request({ method: "eth_chainId" });
    return parseInt(activeChain, 16) === chainId;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const watchTransaction = (txHash, callback) => {
  const provider = _getProvider();
  if (!provider) return;
  provider.once(txHash, (transaction) => {
    callback(transaction, transaction.status === 1);
  });
};

// export const parseBigNumber = (bn, decimals = 2) => {
//   if (!bn) return 0;
//   try {
//     return numberWithCommas(
//       parseFloat(utils.formatUnits(bn)).toFixed(decimals)
//     );
//   } catch (e) {
//     return bn;
//   }
// };

export const parseBigNumber = (bn, decimals = 2) => {
  if (!bn) return 0;
  try {
    return numberWithCommas(
      parseFloat(utils.formatUnits(bn, "gwei")).toFixed(decimals)
    );
  } catch (e) {
    return bn;
  }
};

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
