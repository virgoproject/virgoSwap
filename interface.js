const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;

let notyf = new Notyf({position: {x:'center',y:'top'}});

// Web3modal instance
let web3Modal;

// Chosen wallet provider given by the dialog window
let provider;
let web3;

let account;
let VGO_balance = 0;
let BNB_balance = 0;

let rate = 0;

let allowance = 0;

let mode = 1;

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


$("#btnConnect").click(function(){
    connect();
});

$("#btnConnect2").click(function(){
    connect();
});

async function connect(){
    $("#btnConnect").attr("disabled", true);
    $("#btnConnect2").attr("disabled", true);
    try {
        provider = await web3Modal.connect();
        web3 = new Web3(provider);

        web3.eth.getAccounts().then(function(result){
            $("#btnConnect").hide();
            $("#btnConnect2").hide();
            $("#btnEnable").show();
            $("#btnDisconnect").show();

            $("#referralStats").show();

            $("#otherAmount").attr("disabled", false);
            $("#vgoAmount").attr("disabled", false);
            $("#maxBtn").attr("disabled", false);

            account = result[0];

            if(referralAddress == account)
                referralAddress = "0x0000000000000000000000000000000000000000";

            contract = new web3.eth.Contract(tokenABI, tokenAddress, { from: account});
            pairContract = new web3.eth.Contract(pairABI, pairAddress, { from: account});
            proxyContract = new web3.eth.Contract(proxyABI, proxyAddress, { from: account});
            referralsContract = new web3.eth.Contract(referralsABI, referralsAddress, { from: account});

            updateStats();
            setInterval(function(){
                updateStats();
            }, 5000);

            retrieveReferral();
        });
    }catch(e){}

    $("#btnConnect").attr("disabled", false);
    $("#btnConnect2").attr("disabled", false);
}

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
        rate = result*1.01;
       $("#rate").html((rate*10000000000).toFixed(5));
    });

    getTotalReward(account).then(function(result) {
        $("#referralEarnings").html(+formatAmount(result, 18).toFixed(5));
    });

    getAffiliatesCount(account).then(function(result) {
        $("#affiliatesCount").html(result);
    });

    checkAllowance();
    checkValue1();
}

function checkAllowance(){
    getAllowance(account, proxyAddress).then(function(result){
        allowance = result;
        console.log("allowance is " + allowance)
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
    checkValue1(true);
});

$("#maxBtn").click(function(){
    if($("#maxBtn").attr("disabled") == "disabled") return;

    $("#otherAmount").val((BNB_balance-2000000000000000)/1000000000000000000);
    otherAmountResize();
    checkValue1(true);
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

function checkValue1(modifyOther){
    let amount = Number.parseFloat($("#otherAmount").val())*1000000000000000000;

    if(isNaN(amount) || amount < 0)
        amount = 0;


    if(amount == BNB_balance-2000000000000000)
        $("#maxBtn").hide();
    else
        $("#maxBtn").show();

    if(modifyOther){
        $("#vgoAmount").val(formatAmount(amount*rate, 8).toFixed(5));
        if(mode > 2)
            mode = 3;
        else
            mode = 1;
    }


    if(amount == 0){
        $("#btnConvert").attr("disabled", true);
        return;
    }

    if(isDisabledBtn($("#btnConvert"))) return;

    if(amount > BNB_balance){
        $("#btnConvert").find("val").html("Insufficient balance");
        $("#btnConvert").attr("disabled", true);
        return;
    }

    $("#btnConvert").find("val").html("Exchange");
    $("#btnConvert").attr("disabled", false);
}

function checkValue2(){
    let amount = Number.parseFloat($("#vgoAmount").val());

    if(isNaN(amount) || amount < 0){
        amount = 0;
        $("#otherAmount").val("0");
    }

    $("#otherAmount").val(formatAmount(amount/rate, 10).toFixed(5));

    checkValue1(false);
    otherAmountResize();

    if(mode > 2)
        mode = 4;
    else
        mode = 2;
}

$("#vgoAmount").on("input", function(){
   checkValue2();
});

$("#btnConvert").click(function(){

    disableBtn($("#btnConvert"));

    switch(mode){
        case 1:
            swapExactBNBForVGO(web3.utils.toWei($("#otherAmount").val(), 'ether'),
                referralAddress).then(function (){
                    enableBtn($("#btnConvert"));
                    updateStats();
                    notyf.success("Trade successful!");
            }).catch(function(e){
                enableBtn($("#btnConvert"));
                console.log(e);
                notyf.error("Trade canceled: " + e.message);
            });
            break;
        case 2:
            swapBNBForExactVGO(Math.ceil(Number.parseFloat($("#vgoAmount").val())*100000000),
                Math.ceil(Number.parseInt(web3.utils.toWei($("#otherAmount").val(), 'ether'))*1.1),
                referralAddress).then(function (){
                    enableBtn($("#btnConvert"));
                    updateStats();
                    notyf.success("Trade successful!");
            }).catch(function(e){
                enableBtn($("#btnConvert"));
                console.log(e);
                notyf.error("Trade canceled: " + e.message);
            });
            break;
        case 3:
            swapVGOForExactBNB(web3.utils.toWei($("#otherAmount").val(), 'ether'),
                referralAddress).then(function (){
                    enableBtn($("#btnConvert"));
                    updateStats();
                    notyf.success("Trade successful!");
            }).catch(function(e){
                enableBtn($("#btnConvert"));
                console.log(e);
                notyf.error("Trade canceled: " + e.message);
            });
            break;
        case 4:
            swapExactVGOForBNB(Math.ceil(Number.parseFloat($("#vgoAmount").val())*100000000),
                referralAddress).then(function (){
                    enableBtn($("#btnConvert"));
                    updateStats();
                    notyf.success("Trade successful!");
            }).catch(function(e){
                enableBtn($("#btnConvert"));
                console.log(e);
                notyf.error("Trade canceled: " + e.message);
            });
    }

});

$("#switchBtn").click(function(){
    if(mode > 2){
        mode -= 2;
        $("#VGOInput").insertAfter("#rateAndSwap");
        $("#otherInput").insertAfter("#amountText");
    } else {
        mode += 2;
        $("#otherInput").insertAfter("#rateAndSwap");
        $("#VGOInput").insertAfter("#amountText");
    }

    let text = $("#receiveText").html();
    let text2 = $("#sendText").html();
    $("#sendText").html(text);
    $("#receiveText").html(text2);
});

//disable again inputs as some browsers don't reset inputs states on reload
$("#otherAmount").attr("disabled", true);
$("#vgoAmount").attr("disabled", true);
$("#maxBtn").attr("disabled", true);
$("#btnConvert").attr("disabled", true);
$("#btnCopyReferral").attr("disabled", true);
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

$("#exchangeBtn").click(function(){
    if($("#exchangeBtn").hasClass("active")) return;

    $("#referralBtn").removeClass("active");
    $("#exchangeBtn").addClass("active");

    $("#referralInterface").hide();
    $("#swapInterface").show();
});

$("#referralBtn").click(function(){
    if($("#referralBtn").hasClass("active")) return;

    $("#exchangeBtn").removeClass("active");
    $("#referralBtn").addClass("active");

    $("#swapInterface").hide();
    $("#referralInterface").show();
});

$("#btnCopyReferral").click(function(){
    var copyText = document.querySelector("#referralInput");
    copyText.select();
    document.execCommand("copy");
});

async function retrieveReferral(){
    $("#referralInput").attr("placeholder", "Retrieving..");
    let response = await fetch('https://virgo.net/swap/referral.php?address='+account);
    let text = await response.text();
    $("#referralInput").attr("value", "https://virgo.net/?r=" + text);
    $("#btnCopyReferral").attr("disabled", false);
}