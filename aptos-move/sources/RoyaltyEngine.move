module ChainTrack::RoyaltyEngine {
    use std::vector;
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::coin::Coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use ChainTrack::ContentRegistry;

    // Tracks owed royalties per content index
    struct Balance has key {
        amounts: vector<u64>,
    }

    // Deploy a Balance with size slots, all zeroed
    public fun init_engine(account: &signer, size: u64) acquires Balance {
        move_to<Balance>(
            account,
            Balance { amounts: vector::empty<u64>() }
        );
        let bal_ref = borrow_global_mut<Balance>(signer::address_of(account));
        fill_zeros(&mut bal_ref.amounts, size);
    }

    // Recursive helper: push n zeros into the vector
    fun fill_zeros(amounts: &mut vector<u64>, n: u64) {
        if (n == 0) {
            return;
        };
        vector::push_back(amounts, 0);
        fill_zeros(amounts, n - 1);
    }

    // Oracle-only: record usage and credit royalties
    public fun report_usage(
        oracle: &signer,
        owner: address,
        index: u64,
        revenue: u64
    ) acquires Balance {
        // TODO: replace with your real oracle check
        assert!(signer::address_of(oracle) == signer::address_of(oracle), 1);

        let payment: Coin<AptosCoin> = coin::withdraw<AptosCoin>(oracle, revenue);
        coin::deposit<AptosCoin>(signer::address_of(oracle), payment);

        let bal_ref = borrow_global_mut<Balance>(owner);
        let current = *vector::borrow(&bal_ref.amounts, index);
        let bps = ContentRegistry::get_royalty_bps(owner, index);
        let share = revenue * bps / 10000;
        *vector::borrow_mut(&mut bal_ref.amounts, index) = current + share;
    }

    // Creator claims and withdraws all accumulated royalties
    public fun claim_payout(account: &signer) acquires Balance {
        let owner = signer::address_of(account);
        let bal_ref = borrow_global_mut<Balance>(owner);
        let len = vector::length(&bal_ref.amounts);
        payout_loop(account, &mut bal_ref.amounts, len);
    }

    // Recursive helper: iterate slots [0..n) in reverse and pay out
    fun payout_loop(account: &signer, amounts: &mut vector<u64>, n: u64) {
        if (n == 0) {
            return;
        };
        let idx = n - 1;
        let owed = *vector::borrow(amounts, idx);
        if (owed > 0) {
            let payout: Coin<AptosCoin> = coin::withdraw<AptosCoin>(account, owed);
            coin::deposit<AptosCoin>(signer::address_of(account), payout);
            *vector::borrow_mut(amounts, idx) = 0;
        };
        payout_loop(account, amounts, idx);
    }
}