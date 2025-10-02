use starknet::ContractAddress;
use starknet::get_caller_address;
use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
use core::starknet::storage::Map;
use core::starknet::storage::StorageMapReadAccess;
use core::starknet::storage::StorageMapWriteAccess;

/// Interface for Payment Router (Multi-chain)
#[starknet::interface]
pub trait IPaymentRouter<TContractState> {
    /// Route payment from one chain to another
    fn route_payment(ref self: TContractState, from_chain: u8, to_chain: u8, amount: u256, recipient: ContractAddress) -> u256;
    /// Bridge Bitcoin to Starknet
    fn bridge_bitcoin_to_starknet(ref self: TContractState, amount: u256, recipient: ContractAddress) -> u256;
    /// Bridge from Starknet to Bitcoin
    fn bridge_starknet_to_bitcoin(ref self: TContractState, amount: u256, bitcoin_address: felt252) -> u256;
    /// Get supported chains
    fn get_supported_chains(self: @ContractState) -> Array<ChainInfo>;
    /// Get chain info
    fn get_chain_info(self: @ContractState, chain_id: u8) -> ChainInfo;
    /// Get routing fee
    fn get_routing_fee(self: @ContractState, from_chain: u8, to_chain: u8) -> u256;
    /// Get payment status
    fn get_payment_status(self: @ContractState, payment_id: u256) -> PaymentStatus;
    /// Process cross-chain payment
    fn process_cross_chain_payment(ref self: TContractState, payment_id: u256, proof: Array<felt252>) -> bool;
    /// Admin functions
    fn add_supported_chain(ref self: TContractState, chain_info: ChainInfo);
    fn set_routing_fee(ref self: TContractState, from_chain: u8, to_chain: u8, fee: u256);
    fn set_bridge_contract(ref self: TContractState, chain_id: u8, bridge_contract: ContractAddress);
}

/// Chain information structure
#[derive(Drop, Serde, starknet::Store)]
pub struct ChainInfo {
    pub chain_id: u8,
    pub name: felt252,
    pub is_active: bool,
    pub bridge_contract: ContractAddress,
    pub min_amount: u256,
    pub max_amount: u256,
    pub fee_percentage: u256, // Basis points
}

/// Payment status structure
#[derive(Drop, Serde, starknet::Store)]
pub struct PaymentStatus {
    pub payment_id: u256,
    pub from_chain: u8,
    pub to_chain: u8,
    pub amount: u256,
    pub recipient: ContractAddress,
    pub status: u8, // 0: Pending, 1: Processing, 2: Completed, 3: Failed
    pub created_at: u64,
    pub completed_at: u64,
    pub tx_hash: felt252,
}

/// Payment Router Contract
#[starknet::contract]
pub mod PaymentRouter {
    use super::{
        ChainInfo, PaymentStatus, IPaymentRouter, ContractAddress, get_caller_address
    };
    use core::starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use core::starknet::storage::Map;
    use core::starknet::storage::StorageMapReadAccess;
    use core::starknet::storage::StorageMapWriteAccess;
    use core::array::ArrayTrait;

    #[storage]
    struct Storage {
        // Admin
        admin: ContractAddress,
        
        // Supported chains
        supported_chains: Map<u8, ChainInfo>,
        chain_count: u8,
        
        // Routing fees
        routing_fees: Map<(u8, u8), u256>,
        
        // Payments
        payments: Map<u256, PaymentStatus>,
        next_payment_id: u256,
        
        // External contracts
        staking_vault: ContractAddress,
        game_engine: ContractAddress,
        privacy_layer: ContractAddress,
        
        // Bridge contracts
        bitcoin_bridge: ContractAddress,
        ethereum_bridge: ContractAddress,
        polygon_bridge: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        admin: ContractAddress,
        staking_vault: ContractAddress,
        game_engine: ContractAddress,
        privacy_layer: ContractAddress
    ) {
        self.admin.write(admin);
        self.staking_vault.write(staking_vault);
        self.game_engine.write(game_engine);
        self.privacy_layer.write(privacy_layer);
        self.next_payment_id.write(1);
        self.chain_count.write(0);
        
        // Initialize default chains
        self._initialize_default_chains();
    }

    #[abi(embed_v0)]
    impl PaymentRouterImpl of IPaymentRouter<ContractState> {
        fn route_payment(ref self: ContractState, from_chain: u8, to_chain: u8, amount: u256, recipient: ContractAddress) -> u256 {
            let caller = get_caller_address();
            
            // Validate chains
            let from_chain_info = self.supported_chains.read(from_chain);
            let to_chain_info = self.supported_chains.read(to_chain);
            assert(from_chain_info.is_active, 'From chain not supported');
            assert(to_chain_info.is_active, 'To chain not supported');
            
            // Validate amount
            assert(amount >= from_chain_info.min_amount, 'Amount below minimum');
            assert(amount <= from_chain_info.max_amount, 'Amount above maximum');
            
            // Calculate routing fee
            let fee = self._calculate_routing_fee(from_chain, to_chain, amount);
            let net_amount = amount - fee;
            
            // Create payment record
            let payment_id = self.next_payment_id.read();
            self.next_payment_id.write(payment_id + 1);
            
            let current_time = starknet::get_block_timestamp();
            let payment_status = PaymentStatus {
                payment_id,
                from_chain,
                to_chain,
                amount: net_amount,
                recipient,
                status: 0, // Pending
                created_at: current_time,
                completed_at: 0,
                tx_hash: 0,
            };
            
            self.payments.write(payment_id, payment_status);
            
            payment_id
        }

        fn bridge_bitcoin_to_starknet(ref self: ContractState, amount: u256, recipient: ContractAddress) -> u256 {
            let caller = get_caller_address();
            
            // Validate amount
            let bitcoin_chain = self.supported_chains.read(0); // Assuming 0 is Bitcoin
            assert(amount >= bitcoin_chain.min_amount, 'Amount below minimum');
            assert(amount <= bitcoin_chain.max_amount, 'Amount above maximum');
            
            // Calculate fee
            let fee = self._calculate_routing_fee(0, 1, amount); // 0: Bitcoin, 1: Starknet
            let net_amount = amount - fee;
            
            // Create payment record
            let payment_id = self.next_payment_id.read();
            self.next_payment_id.write(payment_id + 1);
            
            let current_time = starknet::get_block_timestamp();
            let payment_status = PaymentStatus {
                payment_id,
                from_chain: 0, // Bitcoin
                to_chain: 1,   // Starknet
                amount: net_amount,
                recipient,
                status: 1, // Processing
                created_at: current_time,
                completed_at: 0,
                tx_hash: 0,
            };
            
            self.payments.write(payment_id, payment_status);
            
            payment_id
        }

        fn bridge_starknet_to_bitcoin(ref self: ContractState, amount: u256, bitcoin_address: felt252) -> u256 {
            let caller = get_caller_address();
            
            // Validate amount
            let starknet_chain = self.supported_chains.read(1); // Assuming 1 is Starknet
            assert(amount >= starknet_chain.min_amount, 'Amount below minimum');
            assert(amount <= starknet_chain.max_amount, 'Amount above maximum');
            
            // Calculate fee
            let fee = self._calculate_routing_fee(1, 0, amount); // 1: Starknet, 0: Bitcoin
            let net_amount = amount - fee;
            
            // Create payment record
            let payment_id = self.next_payment_id.read();
            self.next_payment_id.write(payment_id + 1);
            
            let current_time = starknet::get_block_timestamp();
            let payment_status = PaymentStatus {
                payment_id,
                from_chain: 1, // Starknet
                to_chain: 0,   // Bitcoin
                amount: net_amount,
                recipient: 0, // Will be set to bitcoin_address in processing
                status: 1, // Processing
                created_at: current_time,
                completed_at: 0,
                tx_hash: 0,
            };
            
            self.payments.write(payment_id, payment_status);
            
            payment_id
        }

        fn get_supported_chains(self: @ContractState) -> Array<ChainInfo> {
            let mut result = ArrayTrait::new();
            let count = self.chain_count.read();
            let mut i = 0;
            
            while i < count {
                let chain_info = self.supported_chains.read(i);
                if chain_info.is_active {
                    result.append(chain_info);
                };
                i += 1;
            };
            
            result
        }

        fn get_chain_info(self: @ContractState, chain_id: u8) -> ChainInfo {
            self.supported_chains.read(chain_id)
        }

        fn get_routing_fee(self: @ContractState, from_chain: u8, to_chain: u8) -> u256 {
            self.routing_fees.read((from_chain, to_chain))
        }

        fn get_payment_status(self: @ContractState, payment_id: u256) -> PaymentStatus {
            self.payments.read(payment_id)
        }

        fn process_cross_chain_payment(ref self: ContractState, payment_id: u256, proof: Array<felt252>) -> bool {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin');
            
            let mut payment = self.payments.read(payment_id);
            assert(payment.status == 1, 'Payment not processing'); // Must be processing
            
            // Verify proof (simplified)
            let proof_valid = self._verify_cross_chain_proof(proof, payment);
            assert(proof_valid, 'Invalid proof');
            
            // Update payment status
            payment.status = 2; // Completed
            payment.completed_at = starknet::get_block_timestamp();
            self.payments.write(payment_id, payment);
            
            true
        }

        fn add_supported_chain(ref self: ContractState, chain_info: ChainInfo) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin');
            
            let chain_id = chain_info.chain_id;
            self.supported_chains.write(chain_id, chain_info);
            
            let count = self.chain_count.read();
            if chain_id >= count {
                self.chain_count.write(chain_id + 1);
            };
        }

        fn set_routing_fee(ref self: ContractState, from_chain: u8, to_chain: u8, fee: u256) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin');
            self.routing_fees.write((from_chain, to_chain), fee);
        }

        fn set_bridge_contract(ref self: ContractState, chain_id: u8, bridge_contract: ContractAddress) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'Only admin');
            
            let mut chain_info = self.supported_chains.read(chain_id);
            chain_info.bridge_contract = bridge_contract;
            self.supported_chains.write(chain_id, chain_info);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _initialize_default_chains(ref self: ContractState) {
            // Bitcoin chain
            let bitcoin_chain = ChainInfo {
                chain_id: 0,
                name: 'Bitcoin',
                is_active: true,
                bridge_contract: 0,
                min_amount: 1000, // 1000 satoshis
                max_amount: 21000000000000, // 21M BTC in satoshis
                fee_percentage: 50, // 0.5%
            };
            self.supported_chains.write(0, bitcoin_chain);
            
            // Starknet chain
            let starknet_chain = ChainInfo {
                chain_id: 1,
                name: 'Starknet',
                is_active: true,
                bridge_contract: 0,
                min_amount: 1000,
                max_amount: 1000000000000000, // 1M ETH equivalent
                fee_percentage: 30, // 0.3%
            };
            self.supported_chains.write(1, starknet_chain);
            
            // Ethereum chain
            let ethereum_chain = ChainInfo {
                chain_id: 2,
                name: 'Ethereum',
                is_active: true,
                bridge_contract: 0,
                min_amount: 1000000000000000, // 0.001 ETH
                max_amount: 1000000000000000000000, // 1000 ETH
                fee_percentage: 100, // 1%
            };
            self.supported_chains.write(2, ethereum_chain);
            
            self.chain_count.write(3);
            
            // Set default routing fees
            self.routing_fees.write((0, 1), 50); // Bitcoin to Starknet: 0.5%
            self.routing_fees.write((1, 0), 50); // Starknet to Bitcoin: 0.5%
            self.routing_fees.write((0, 2), 100); // Bitcoin to Ethereum: 1%
            self.routing_fees.write((2, 0), 100); // Ethereum to Bitcoin: 1%
            self.routing_fees.write((1, 2), 30); // Starknet to Ethereum: 0.3%
            self.routing_fees.write((2, 1), 30); // Ethereum to Starknet: 0.3%
        }

        fn _calculate_routing_fee(self: @ContractState, from_chain: u8, to_chain: u8, amount: u256) -> u256 {
            let fee_percentage = self.routing_fees.read((from_chain, to_chain));
            amount * fee_percentage / 10000 // Convert basis points to percentage
        }

        fn _verify_cross_chain_proof(self: @ContractState, proof: Array<felt252>, payment: PaymentStatus) -> bool {
            // Simplified proof verification
            // In real implementation, verify against the source chain
            let proof_len = proof.len();
            assert(proof_len > 0, 'Empty proof');
            
            // Check if proof contains valid transaction hash
            let tx_hash = *proof.at(0);
            payment.tx_hash == tx_hash
        }
    }
}
