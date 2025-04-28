// ContentRegistry.move
module ChainTrack::ContentRegistry {
    use std::vector;
    use std::signer;
    use std::string;
    use std::string::String;

    // Data struct allowed in a vector
    struct Content has store {
        owner: address,
        metadata_cid: String,
        royalty_bps: u64,
    }

    // Registry resource under module address
    struct Registry has key {
        contents: vector<Content>,
    }

    // Deploy an empty registry under account
    public fun init_registry(account: &signer) {
        move_to<Registry>(account, Registry { contents: vector::empty<Content>() });
    }

    // Add a new video entry
    public fun register_video(
        account: &signer,
        metadata_cid: String,
        royalty_bps: u64
    ) acquires Registry {
        let owner = signer::address_of(account);
        let reg_ref = borrow_global_mut<Registry>(owner);
        vector::push_back(&mut reg_ref.contents, Content { owner, metadata_cid, royalty_bps });
    }

    // Read just the royalty basis points for index
    public fun get_royalty_bps(account: address, index: u64): u64 acquires Registry {
        let reg_ref = borrow_global<Registry>(account);
        let c = vector::borrow(&reg_ref.contents, index);
        c.royalty_bps
    }

    // How many videos have been registered
    public fun content_count(account: address): u64 acquires Registry {
        let reg_ref = borrow_global<Registry>(account);
        vector::length(&reg_ref.contents)
    }

    // Unit test for the above functionality
    #[test(account = @ChainTrack)]
    public fun test_content_registry(account: signer) acquires Registry {
        let owner = signer::address_of(&account);

        // After init, registry should be empty
        init_registry(&account);
        assert!(content_count(owner) == 0, 100);

        // Register one video with a simple UTF8 cid
        let cid = string::utf8(b"test-cid");
        register_video(&account, cid, 555);

        // Now count must be 1
        assert!(content_count(owner) == 1, 101);

        // And royalty_bps matches
        let bps = get_royalty_bps(owner, 0);
        assert!(bps == 555, 102);
    }
}
