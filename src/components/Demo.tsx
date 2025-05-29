"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "../components/ui/input";
import { signIn, signOut, getCsrfToken } from "next-auth/react";
import sdk, {
  SignIn as SignInCore,
} from "@farcaster/frame-sdk";
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useDisconnect,
  useConnect,
  useSwitchChain,
  useChainId,
} from "wagmi";
import {
  useConnection as useSolanaConnection,
  useWallet as useSolanaWallet,
} from '@solana/wallet-adapter-react';
import { useHasSolanaProvider } from "./providers/SafeFarcasterSolanaProvider";

import { config } from "./providers/WagmiProvider";
import { Button } from "./ui/Button";
import { truncateAddress } from "../lib/truncateAddress";
import { base, degen, mainnet, optimism, unichain } from "wagmi/chains";
import { BaseError, UserRejectedRequestError } from "viem";
import { useSession } from "next-auth/react";
import { Label } from "./ui/label";
import { useFrame } from "./providers/FrameProvider";
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

export default function Demo(
  { title }: { title?: string } = { title: "Frames v2 Demo" }
) {
  const { isSDKLoaded, context, notifications, isConnected } = useFrame();
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [sendNotificationResult, setSendNotificationResult] = useState("");
  const [copied, setCopied] = useState(false);

  const { address } = useAccount();
  const chainId = useChainId();
  const hasSolanaProvider = useHasSolanaProvider();
  let solanaWallet, solanaPublicKey, solanaSignMessage, solanaAddress;
  if (hasSolanaProvider) {
    solanaWallet = useSolanaWallet();
    ({ publicKey: solanaPublicKey, signMessage: solanaSignMessage } = solanaWallet);
    solanaAddress = solanaPublicKey?.toBase58();
  }

  useEffect(() => {
    console.log("isSDKLoaded", isSDKLoaded);
    console.log("context", context);
    console.log("address", address);
    console.log("isConnected", isConnected);
    console.log("chainId", chainId);
  }, [context, address, isConnected, chainId, isSDKLoaded]);

  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

  const {
    signTypedData,
    error: signTypedError,
    isError: isSignTypedError,
    isPending: isSignTypedPending,
  } = useSignTypedData();

  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();

  const {
    switchChain,
    error: switchChainError,
    isError: isSwitchChainError,
    isPending: isSwitchChainPending,
  } = useSwitchChain();

  const nextChain = useMemo(() => {
    if (chainId === base.id) {
      return optimism;
    } else if (chainId === optimism.id) {
      return degen;
    } else if (chainId === degen.id) {
      return mainnet;
    } else if (chainId === mainnet.id) {
      return unichain;
    } else {
      return base;
    }
  }, [chainId]);

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: nextChain.id });
  }, [switchChain, nextChain.id]);

  const sendNotification = useCallback(async () => {
    setSendNotificationResult("");
    if (!notifications.length || !context) {
      return;
    }

    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        mode: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: context.user.fid,
          notificationDetails: notifications[0],
        }),
      });

      if (response.status === 200) {
        setSendNotificationResult("Success");
        return;
      } else if (response.status === 429) {
        setSendNotificationResult("Rate limited");
        return;
      }

      const data = await response.text();
      setSendNotificationResult(`Error: ${data}`);
    } catch (error) {
      setSendNotificationResult(`Error: ${error}`);
    }
  }, [context, notifications]);

  const sendTx = useCallback(() => {
    sendTransaction(
      {
        // call yoink() on Yoink contract
        to: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
        data: "0x9846cd9efc000023c0",
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
        },
      }
    );
  }, [sendTransaction]);

  const signTyped = useCallback(() => {
    signTypedData({
      domain: {
        name: "Frames v2 Demo",
        version: "1",
        chainId,
      },
      types: {
        Message: [{ name: "content", type: "string" }],
      },
      message: {
        content: "Hello from Frames v2!",
      },
      primaryType: "Message",
    });
  }, [chainId, signTypedData]);

  const toggleContext = useCallback(() => {
    setIsContextOpen((prev) => !prev);
  }, []);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

        <div className="mb-4">
          <h2 className="font-2xl font-bold">Context</h2>
          <button
            onClick={toggleContext}
            className="flex items-center gap-2 transition-colors"
          >
            <span>Toggle Context</span>
          </button>
          {isContextOpen && (
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
              {JSON.stringify(context, null, 2)}
            </pre>
          )}
        </div>

        <div className="mb-4">
          <h2 className="font-2xl font-bold">Notifications</h2>
          <div className="mt-2">
            {notifications.map((notification) => (
              <div key={notification.token} className="p-2 bg-gray-100 rounded mb-2">
                <p>URL: {notification.url}</p>
                <p>Token: {notification.token}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="font-2xl font-bold">Send Notification</h2>
          <button
            onClick={sendNotification}
            className="w-full p-2 bg-blue-500 text-white rounded"
            disabled={!notifications.length}
          >
            Send Notification
          </button>
          {sendNotificationResult && (
            <p className="mt-2 text-sm">{sendNotificationResult}</p>
          )}
        </div>

        <div className="mb-4">
          <h2 className="font-2xl font-bold">Send Transaction</h2>
          <button
            onClick={sendTx}
            className="w-full p-2 bg-blue-500 text-white rounded"
            disabled={isSendTxPending}
          >
            {isSendTxPending ? "Sending..." : "Send Transaction"}
          </button>
          {txHash && (
            <p className="mt-2 text-sm">
              Transaction Hash: {truncateAddress(txHash)}
            </p>
          )}
          {isConfirming && <p className="mt-2 text-sm">Confirming...</p>}
          {isConfirmed && <p className="mt-2 text-sm">Confirmed!</p>}
          {isSendTxError && (
            <p className="mt-2 text-sm text-red-500">
              Error: {sendTxError?.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <h2 className="font-2xl font-bold">Sign Typed Data</h2>
          <button
            onClick={signTyped}
            className="w-full p-2 bg-blue-500 text-white rounded"
            disabled={isSignTypedPending}
          >
            {isSignTypedPending ? "Signing..." : "Sign Typed Data"}
          </button>
          {isSignTypedError && (
            <p className="mt-2 text-sm text-red-500">
              Error: {signTypedError?.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <h2 className="font-2xl font-bold">Switch Chain</h2>
          <button
            onClick={handleSwitchChain}
            className="w-full p-2 bg-blue-500 text-white rounded"
            disabled={isSwitchChainPending}
          >
            {isSwitchChainPending
              ? "Switching..."
              : `Switch to ${nextChain.name}`}
          </button>
          {isSwitchChainError && (
            <p className="mt-2 text-sm text-red-500">
              Error: {switchChainError?.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Solana functions inspired by farcaster demo
// https://github.com/farcasterxyz/frames-v2-demo/blob/main/src/components/Demo.tsx
function SignSolanaMessage({ signMessage }: { signMessage?: (message: Uint8Array) => Promise<Uint8Array> }) {
  const [signature, setSignature] = useState<string | undefined>();
  const [signError, setSignError] = useState<Error | undefined>();
  const [signPending, setSignPending] = useState(false);

  const handleSignMessage = useCallback(async () => {
    setSignPending(true);
    try {
      if (!signMessage) {
        throw new Error('no Solana signMessage');
      }
      const input = new TextEncoder().encode("Hello from Solana!");
      const signatureBytes = await signMessage(input);
      const signature = btoa(String.fromCharCode(...signatureBytes));
      setSignature(signature);
      setSignError(undefined);
    } catch (e) {
      if (e instanceof Error) {
        setSignError(e);
      }
    } finally {
      setSignPending(false);
    }
  }, [signMessage]);

  return (
    <>
      <Button
        onClick={handleSignMessage}
        disabled={signPending}
        isLoading={signPending}
        className="mb-4"
      >
        Sign Message
      </Button>
      {signError && renderError(signError)}
      {signature && (
        <div className="mt-2 text-xs">
          <div>Signature: {signature}</div>
        </div>
      )}
    </>
  );
}

function SendSolana() {
  const [state, setState] = useState<
    | { status: 'none' }
    | { status: 'pending' }
    | { status: 'error'; error: Error }
    | { status: 'success'; signature: string }
  >({ status: 'none' });

  const { connection: solanaConnection } = useSolanaConnection();
  const { sendTransaction, publicKey } = useSolanaWallet();

  // This should be replaced but including it from the original demo
  // https://github.com/farcasterxyz/frames-v2-demo/blob/main/src/components/Demo.tsx#L718
  const ashoatsPhantomSolanaWallet = 'Ao3gLNZAsbrmnusWVqQCPMrcqNi6jdYgu8T6NCoXXQu1';

  const handleSend = useCallback(async () => {
    setState({ status: 'pending' });
    try {
      if (!publicKey) {
        throw new Error('no Solana publicKey');
      }

      const { blockhash } = await solanaConnection.getLatestBlockhash();
      if (!blockhash) {
        throw new Error('failed to fetch latest Solana blockhash');
      }

      const fromPubkeyStr = publicKey.toBase58();
      const toPubkeyStr = ashoatsPhantomSolanaWallet;
      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(fromPubkeyStr),
          toPubkey: new PublicKey(toPubkeyStr),
          lamports: 0n,
        }),
      );
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(fromPubkeyStr);

      const simulation = await solanaConnection.simulateTransaction(transaction);
      if (simulation.value.err) {
        // Gather logs and error details for debugging
        const logs = simulation.value.logs?.join('\n') ?? 'No logs';
        const errDetail = JSON.stringify(simulation.value.err);
        throw new Error(`Simulation failed: ${errDetail}\nLogs:\n${logs}`);
      }
      const signature = await sendTransaction(transaction, solanaConnection);
      setState({ status: 'success', signature });
    } catch (e) {
      if (e instanceof Error) {
        setState({ status: 'error', error: e });
      } else {
        setState({ status: 'none' });
      }
    }
  }, [sendTransaction, publicKey, solanaConnection]);

  return (
    <>
      <Button
        onClick={handleSend}
        disabled={state.status === 'pending'}
        isLoading={state.status === 'pending'}
        className="mb-4"
      >
        Send Transaction (sol)
      </Button>
      {state.status === 'error' && renderError(state.error)}
      {state.status === 'success' && (
        <div className="mt-2 text-xs">
          <div>Hash: {truncateAddress(state.signature)}</div>
        </div>
      )}
    </>
  );
}

function SignEvmMessage() {
  const { isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const {
    signMessage,
    data: signature,
    error: signError,
    isError: isSignError,
    isPending: isSignPending,
  } = useSignMessage();

  const handleSignMessage = useCallback(async () => {
    if (!isConnected) {
      await connectAsync({
        chainId: base.id,
        connector: config.connectors[0],
      });
    }

    signMessage({ message: "Hello from Frames v2!" });
  }, [connectAsync, isConnected, signMessage]);

  return (
    <>
      <Button
        onClick={handleSignMessage}
        disabled={isSignPending}
        isLoading={isSignPending}
      >
        Sign Message
      </Button>
      {isSignError && renderError(signError)}
      {signature && (
        <div className="mt-2 text-xs">
          <div>Signature: {signature}</div>
        </div>
      )}
    </>
  );
}

function SendEth() {
  const { isConnected, chainId } = useAccount();
  const {
    sendTransaction,
    data,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: data,
    });

  const toAddr = useMemo(() => {
    // Protocol guild address
    return chainId === base.id
      ? "0x32e3C7fD24e175701A35c224f2238d18439C7dBC"
      : "0xB3d8d7887693a9852734b4D25e9C0Bb35Ba8a830";
  }, [chainId]);

  const handleSend = useCallback(() => {
    sendTransaction({
      to: toAddr,
      value: 1n,
    });
  }, [toAddr, sendTransaction]);

  return (
    <>
      <Button
        onClick={handleSend}
        disabled={!isConnected || isSendTxPending}
        isLoading={isSendTxPending}
      >
        Send Transaction (eth)
      </Button>
      {isSendTxError && renderError(sendTxError)}
      {data && (
        <div className="mt-2 text-xs">
          <div>Hash: {truncateAddress(data)}</div>
          <div>
            Status:{" "}
            {isConfirming
              ? "Confirming..."
              : isConfirmed
              ? "Confirmed!"
              : "Pending"}
          </div>
        </div>
      )}
    </>
  );
}

function SignIn() {
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signInResult, setSignInResult] = useState<SignInCore.SignInResult>();
  const [signInFailure, setSignInFailure] = useState<string>();
  const { data: session, status } = useSession();

  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Unable to generate nonce");
    return nonce;
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true);
      setSignInFailure(undefined);
      const nonce = await getNonce();
      const result = await sdk.actions.signIn({ nonce });
      setSignInResult(result);

      await signIn("credentials", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });
    } catch (e) {
      if (e instanceof SignInCore.RejectedByUser) {
        setSignInFailure("Rejected by user");
        return;
      }

      setSignInFailure("Unknown error");
    } finally {
      setSigningIn(false);
    }
  }, [getNonce]);

  const handleSignOut = useCallback(async () => {
    try {
      setSigningOut(true);
      await signOut({ redirect: false });
      setSignInResult(undefined);
    } finally {
      setSigningOut(false);
    }
  }, []);

  return (
    <>
      {status !== "authenticated" && (
        <Button onClick={handleSignIn} disabled={signingIn}>
          Sign In with Farcaster
        </Button>
      )}
      {status === "authenticated" && (
        <Button onClick={handleSignOut} disabled={signingOut}>
          Sign out
        </Button>
      )}
      {session && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">Session</div>
          <div className="whitespace-pre">
            {JSON.stringify(session, null, 2)}
          </div>
        </div>
      )}
      {signInFailure && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">{signInFailure}</div>
        </div>
      )}
      {signInResult && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">
            {JSON.stringify(signInResult, null, 2)}
          </div>
        </div>
      )}
    </>
  );
}

function ViewProfile() {
  const [fid, setFid] = useState("3");

  return (
    <>
      <div>
        <Label
          className="text-xs font-semibold text-gray-500 mb-1"
          htmlFor="view-profile-fid"
        >
          Fid
        </Label>
        <Input
          id="view-profile-fid"
          type="number"
          value={fid}
          className="mb-2"
          onChange={(e) => {
            setFid(e.target.value);
          }}
          step="1"
          min="1"
        />
      </div>
      <Button
        onClick={() => {
          sdk.actions.viewProfile({ fid: parseInt(fid) });
        }}
      >
        View Profile
      </Button>
    </>
  );
}

const renderError = (error: Error | null) => {
  if (!error) return null;
  if (error instanceof BaseError) {
    const isUserRejection = error.walk(
      (e) => e instanceof UserRejectedRequestError
    );

    if (isUserRejection) {
      return <div className="text-red-500 text-xs mt-1">Rejected by user.</div>;
    }
  }

  return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
};

