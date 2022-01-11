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

let allowance = 0;

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
            $("#btnDisonnect").show();

            $("#otherAmount").attr("disabled", false);
            $("#vgoAmount").attr("disabled", false);
            $("#maxBtn").attr("disabled", false);


            account = result[0];

            contract = new web3.eth.Contract(tokenABI, tokenAddress, { from: account});
            pairContract = new web3.eth.Contract(pairABI, pairAddress, { from: account});

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

    getRate().then(function(result){
       $("#rate").html((result*10100000000).toFixed(5));
    });

    checkAllowance();
}

function checkAllowance(){
    getAllowance(account, proxyAddress).then(function(result){
        allowance = result;
        if(allowance >= 3003200000000000){
            $("#btnEnable").hide();
            $("#btnConvert").show();
        }else{
            $("#btnEnable").show();
            $("#btnConvert").hide();
        }
    });
}

function formatAmount(amount, decimals){
    return amount/Math.pow(10, decimals);
}

async function onDisconnect(){
    if (provider.close)
        await provider.close();

    await web3Modal.clearCachedProvider();
    window.location.reload();
}

function otherAmountResize(){
    $("#otherAmount").css("width", ($("#otherAmount").val().length+2) + "ch");
};

$("#otherAmount").on("input", function(){
    otherAmountResize();
});

$("#maxBtn").click(function(){
    if($("#maxBtn").attr("disabled") == "true") return;
   $("#otherAmount").val($("#bnbBalance").html());
   otherAmountResize();
});

$("#btnEnable").click(function(){
    disableBtn($("#btnEnable"));
    approve(proxyAddress, 6003200000000000).then(function(result){
        let timer = setInterval(function(){
            if (allowance > 3003200000000000){
                clearInterval(timer);
                enableBtn($("#btnEnable"));
                return;
            }

            checkAllowance();
        }, 3000);
    }).catch(function(error){
        console.log(error);
        enableBtn($("#btnEnable"));
    });
});

//disable again inputs as some browsers don't reset inputs states on reload
$("#otherAmount").attr("disabled", true);
$("#vgoAmount").attr("disabled", true);
$("#maxBtn").attr("disabled", true);
$("#otherAmount").val("0");
$("#vgoAmount").val("0");


function disableBtn(elem) {
    elem.find("val").hide();
    elem.find("i").show();
    elem.attr("disabled", true);
}

function enableBtn(elem) {
    elem.find("val").show();
    elem.find("i").hide();
    elem.attr("disabled", false);
}

function isDisabledBtn(elem) {
    return elem.find("val").css("display") == "none";
}