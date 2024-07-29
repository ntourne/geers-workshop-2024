//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

interface IERC20 {
	function totalSupply() external view returns (uint256);
	function balanceOf(address account) external view returns (uint256);
	function transfer(
		address recipient,
		uint256 amount
	) external returns (bool);
	function allowance(
		address owner,
		address spender
	) external view returns (uint256);
	function approve(address spender, uint256 amount) external returns (bool);
	function transferFrom(
		address sender,
		address recipient,
		uint256 amount
	) external returns (bool);

	event Transfer(address indexed from, address indexed to, uint256 value);
	event Approval(
		address indexed owner,
		address indexed spender,
		uint256 value
	);
}

/**
 * A smart contract for an ERC20 token
 * @author ntourne
 */
contract MyToken is IERC20 {
	string public name;
	string public symbol;
	uint8 public decimals;
	uint256 private _totalSupply;
	uint256 public mintingFee;
	uint256 public mintAmount;
	address public owner;
	mapping(address => uint256) private _balances;
	mapping(address => mapping(address => uint256)) private _allowances;

	modifier onlyOwner() {
		require(msg.sender == owner, "Ownable: caller is not the owner");
		_;
	}

	constructor(
		string memory _name,
		string memory _symbol,
		uint8 _decimals,
		uint256 _initialSupply
	) {
		name = _name;
		symbol = _symbol;
		decimals = _decimals;
		mintingFee = 1 ether;
		mintAmount = 1 * 10 ** uint256(decimals);
		owner = msg.sender;
		_mint(msg.sender, _initialSupply);
	}

	function totalSupply() public view override returns (uint256) {
		return _totalSupply;
	}

	function balanceOf(address account) public view override returns (uint256) {
		return _balances[account];
	}

	function transfer(
		address recipient,
		uint256 amount
	) public override returns (bool) {
		require(recipient != address(0), "ERC20: transfer to the zero address");
		require(
			_balances[msg.sender] >= amount,
			"ERC20: transfer amount exceeds balance"
		);

		_balances[msg.sender] -= amount;
		_balances[recipient] += amount;
		emit Transfer(msg.sender, recipient, amount);
		return true;
	}

	function allowance(
		address _owner,
		address spender
	) public view override returns (uint256) {
		return _allowances[_owner][spender];
	}

	function approve(
		address spender,
		uint256 amount
	) public override returns (bool) {
		require(spender != address(0), "ERC20: approve to the zero address");

		_allowances[msg.sender][spender] = amount;
		emit Approval(msg.sender, spender, amount);
		return true;
	}

	function transferFrom(
		address sender,
		address recipient,
		uint256 amount
	) public override returns (bool) {
		require(sender != address(0), "ERC20: transfer from the zero address");
		require(recipient != address(0), "ERC20: transfer to the zero address");
		require(
			_balances[sender] >= amount,
			"ERC20: transfer amount exceeds balance"
		);
		require(
			_allowances[sender][msg.sender] >= amount,
			"ERC20: transfer amount exceeds allowance"
		);

		_balances[sender] -= amount;
		_balances[recipient] += amount;
		_allowances[sender][msg.sender] -= amount;
		emit Transfer(sender, recipient, amount);
		return true;
	}

	function mint(address account) public payable returns (bool) {
		require(
			msg.value == mintingFee,
			"ERC20: value doesn't match to mintingFee"
		);
		_mint(account, mintAmount);
		return true;
	}

	function _mint(address account, uint256 amount) internal {
		require(account != address(0), "ERC20: mint to the zero address");
		_totalSupply += amount;
		_balances[account] += amount;
		emit Transfer(address(0), account, amount);
	}
}
