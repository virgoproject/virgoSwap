const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;

// Web3modal instance
let web3Modal;

// Chosen wallet provider given by the dialog window
let provider;
let web3;

let account;
let VGO_balance = 0;
let BNB_balance = 0;

//Init web3modal once page loaded
$(window).on('load', function(){

    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                rpc: {
                    56: 'https://bsc-dataseed.binance.org/'
                },
                network: 'binance',
                chainId: 56
            }
        }
    };

    web3Modal = new Web3Modal({
        cacheProvider: false, // optional
        providerOptions, // required
        disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
    });

});


$("#btnConnect").click(async function(){
    $("#btnConnect").attr("disabled", true);
    try {
        provider = await web3Modal.connect();
        web3 = new Web3(provider);

        web3.eth.getAccounts().then(function(result){
            $("#btnConnect").hide();
            $("#btnEnable").show();

            account = result[0];

            contract = new web3.eth.Contract(tokenABI, tokenAddress, { from: account});

            updateStats();
            setInterval(function(){
                updateStats();
            }, 5000);

        });
    }catch(e){}

    $("#btnConnect").attr("disabled", false);
});

function updateStats() {
    getBalance(account).then(function(result) {
        VGO_balance = result;
        $("#vgoBalance").html(+formatAmount(VGO_balance,8).toFixed(5));//the + digit remove any trailing 0
    });

    web3.eth.getBalance(account).then(function(result){
        BNB_balance = result;
        $("#bnbBalance").html(+formatAmount(BNB_balance, 18).toFixed(5));
    });
}

function formatAmount(amount, decimals){
    return amount/Math.pow(10, decimals);
}