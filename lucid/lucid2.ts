import {Blockfrost, Lucid, Crypto, fromText, Data, Addresses} from "https://deno.land/x/lucid/mod.ts";

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


async function createMintingScripts(slot_in:bigint) {
    const { payment } = Addresses.inspect(
        await lucid.wallet.address(),
    );

    const mintingScripts = lucid.newScript(
        {
            type: "All",
            scripts: [
                { type: "Sig", keyHash: payment.hash },
                {
                    type: "Before",
                    slot: slot_in,
                },
            ],
        },
    ); 
    
    return mintingScripts;
}


async function mintToken(policyId:string, tokenName: string, amount: bigint, slot_in: bigint) {
    const unit = policyId + fromText(tokenName);
    
    const metadata = {
        [policyId] : {
            [tokenName]: {
                "description": "This is token minted by Lucid",
                "name": `${tokenName}`,
                "id": 1,
                "image": "ipfs://QmRE3Qnz5Q8dVtKghL4NBhJBH4cXPwfRge7HMiBhK92SJX"
            }
        }
    };
    console.log(metadata);

    const tx = await lucid.newTx()
        .mint({ [unit]: amount })
        .validTo(Date.now() + 200000)
        .attachScript(await createMintingScripts(slot_in))
        .attachMetadata(721, metadata)
        .commit();

    return tx;
}

async function burnToken(policyId:string, tokenName: string, amount: bigint, slot_in: bigint) {
    const unit = policyId + fromText(tokenName);

    const tx = await lucid.newTx()
        .mint({ [unit]: -amount })
        .validTo(Date.now() + 200000)
        .attachScript(await createMintingScripts(slot_in))
        .commit();

    return tx;
}

const slot_in = BigInt(78653698); //BigInt(lucid.utils.unixTimeToSlots(Date.now() + 1000000));
console.log(`Slot: ${slot_in}`);

const mintingScripts = await createMintingScripts(slot_in);
const policyId = mintingScripts.toHash();

// Mint token
// const tx = await mintToken(policyId, "Nguyen Hong Sac_253", -1n, slot_in);
// const signedTx = await tx.sign().commit();
// const txHash = await signedTx.submit();
// console.log(`Check in: https://preview.cexplorer.io/tx/${txHash}`);


// Burn
const tx = await burnToken(policyId, "Nguyen Hong Sac_253", -1n, slot_in);
const signedTx = await tx.sign().commit();
const txHash = await signedTx.submit();
console.log(`Check in: https://preview.cexplorer.io/tx/${txHash}`);