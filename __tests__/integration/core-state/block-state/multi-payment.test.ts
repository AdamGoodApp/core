import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Utils, Transactions, Identities } from "@arkecosystem/crypto";
import { delegates } from "@arkecosystem/core-test-framework";
import { BIP39 } from "../../../../packages/core-forger/src/methods/bip39";

import { setUp, tearDown } from "../__support__/setup";

let app: Application;

beforeAll(async () => {
    app = await setUp();
});

afterAll(async () => {
    await tearDown();
});

test("BlockState handling [multi-payment] block", async () => {
    const stateStore = app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore);

    const blockState = app.getTagged<Contracts.State.BlockState>(
        Container.Identifiers.BlockState,
        "state",
        "blockchain",
    );

    const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    const multiPaymentTransaction = Transactions.BuilderFactory.multiPayment()
        .addPayment(Identities.Address.fromPublicKey(delegates[3].publicKey), "100")
        .addPayment(Identities.Address.fromPublicKey(delegates[4].publicKey), "200")
        .nonce("3")
        .fee("100")
        .sign(delegates[2].passphrase)
        .build();

    const bip39 = new BIP39(delegates[1].passphrase);

    const block1 = stateStore.getLastBlock();

    const block2 = bip39.forge([multiPaymentTransaction.data], {
        timestamp: block1.data.timestamp + 60,
        previousBlock: block1.data,
        reward: Utils.BigNumber.make("100"),
    });

    const delegate1 = walletRepository.findByPublicKey(delegates[1].publicKey);
    const delegate2 = walletRepository.findByPublicKey(delegates[2].publicKey);
    const delegate3 = walletRepository.findByPublicKey(delegates[3].publicKey);
    const delegate4 = walletRepository.findByPublicKey(delegates[4].publicKey);

    expect(delegate1.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
    expect(delegate2.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
    expect(delegate3.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
    expect(delegate4.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");

    await blockState.applyBlock(block2);

    expect(delegate1.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000200");
    expect(delegate2.getAttribute("delegate.voteBalance").toFixed()).toBe("299999999999600");
    expect(delegate3.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000100");
    expect(delegate4.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000200");

    await blockState.revertBlock(block2);

    expect(delegate1.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
    expect(delegate2.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
    expect(delegate3.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
    expect(delegate4.getAttribute("delegate.voteBalance").toFixed()).toBe("300000000000000");
});