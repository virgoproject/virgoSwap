let referralAddress = "0x0000000000000000000000000000000000000000";

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

async function getRefAddress(code){
    let response = await fetch('https://virgo.net/swap/referral.php?code='+code);
    let text = await response.text();

    if(text != ""){
        referralAddress = text;
        setCookie("swapReferral", referralAddress, 14);
    }

}

let code = findGetParameter("r");

if(code != null){
    getRefAddress(code);
}else{
    let storedRef = getCookie("swapReferral");
    if(storedRef)
        referralAddress = storedRef;
}