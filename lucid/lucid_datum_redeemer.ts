import {Blockfrost, Lucid, Crypto, fromText, Data} from "https://deno.land/x/lucid/mod.ts";

const lucid = new Lucid({
    provider: new Blockfrost(
        "https://cardano-preview.blockfrost.io/api/v0",
        "previewK1s74gl73sqECTNmb3ngTOImgxrjIpFn",
    ),
});
const seed = "brief parrot real edge puzzle pledge goddess girl violin valid unique mushroom summer silver chimney screen cheese crawl trend indoor peanut execute initial tennis";
lucid.selectWalletFromSeed(seed, {addressType: "Base", index: 0});
const address = await lucid.wallet.address();
console.log("Wallet address: " + address);


const toAddress = "addr_test1qzldl9u0j6ap7mdugtdcre43f8dfrnv7uqd3a6furpyuzw3z70zawv8g3tyg7uh833x50geeul2vpyujyzac0d6dmgcsyu5akw";



// AlwaySucceed script
const alwaysSucceed = lucid.newScript({
    type: "PlutusV3",
    script: "58af01010029800aba2aba1aab9faab9eaab9dab9a48888896600264653001300700198039804000cc01c0092225980099b8748008c01cdd500144c8cc896600266e1d2000300a375400d13232598009808001456600266e1d2000300c375400713371e6eb8c03cc034dd5180798069baa003375c601e601a6ea80222c805a2c8070dd7180700098059baa0068b2012300b001300b300c0013008375400516401830070013003375400f149a26cac80081",
});

const alwaysSucceedAddress = alwaysSucceed.toAddress();
console.log(`Always succeed address: ${alwaysSucceedAddress}`);

// Set datum and redeemer
const DatumSchema = Data.Object({
    msg: Data.Bytes,
});
const RedeemerSchema = Data.Object({
    msg: Data.Bytes,
});
const Datum = () => Data.to({ msg: fromText("Noforthings")}, DatumSchema);
const Redeemer = () => Data.to({ msg: fromText("Noforthings")}, RedeemerSchema);



const lovelace_lock = 100_000_253n;
console.log(`Lovelace lock: ${lovelace_lock}`);


// Lock UTxO
export async function lockUtxo(lovelace:bigint): Promise<string> {
    const tx = await lucid.newTx()
        .payToContract(alwaysSucceedAddress, { Inline: Datum() }, { lovelace })
        .commit();
    const signedTx = await tx.sign().commit();
    const txHash = await signedTx.submit();

    return txHash;
}

// Unlock
export async function unlockUtxo(redeemer: RedeemerSchema): Promise<string> {
    const utxo = (await lucid.utxosAt(alwaysSucceedAddress)).find((utxo) =>
        !utxo.scriptRef && utxo.datum === redeemer
    );
    console.log(`redeemer: ${redeemer}`);
    console.log(utxo);
    if (!utxo) throw new Error(`No UTxo found`);

    const tx = await lucid.newTx()
        .collectFrom([utxo], Redeemer())
        .attachScript(alwaysSucceed)
        .commit();
    const signedTx = await tx.sign().commit();
    const txHash = await signedTx.submit();

    return txHash;
}

async function main() {
    try {
        // const txHash = await lockUtxo(lovelace_lock);
        // console.log(`txHash: ${txHash}`);

        const redeemTxHash = await unlockUtxo(Redeemer());
        console.log(`Transaction hash: ${redeemTxHash}`);
    } catch (error) {
        console.error("Error locking utxo:", error);
    }
}

main()