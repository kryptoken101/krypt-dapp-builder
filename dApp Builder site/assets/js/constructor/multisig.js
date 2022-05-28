var multisigDapp = (function(){
    if (web3.version.network == "1") {
        var multisigContractAddress = multisigMainAddress;
        var network = 'main';
    } else if (web3.version.network == "4") {
        var multisigContractAddress = multisigRinkebyAddress;
        var network = 'rinkeby';
    } else {
        return;
    }
    
    return {
        init: function(){
            window.multisigContract = web3.eth.contract(multisigABI).at(multisigContractAddress);
            this.triggers();
        },
        create: function(approvals, owners, name, value){
            pure_name = name;
            name = web3.toHex(name);
            type = "multisig";
            console.log(name);
            let transactionData = multisigContract.createWallet.getData(approvals, owners, name);
            web3.eth.estimateGas({
                to: multisigContractAddress,
                data: transactionData,
                value: web3.toWei(value, 'ether')
            }, function(e,d){
                web3.eth.sendTransaction({
                    to: multisigContractAddress,
                    data: transactionData,
                    gas: d,
                    value: web3.toWei(value, 'ether')
                }, function(e,d){
                    if (!e && d) {
                        addApp(type, pure_name, network);
                    }
                })
            })
        },
        triggers: function(){
            var that = this;
            $('#multisig-first-owner').val(web3.eth.defaultAccount);
            $('#multisig-add-owner').click(function(){
                $('#multisig-owners').append(
                    '<div style="display:none;" class="input-group creation-form">' +
                        '<span class="input-group-addon">Owner:</span>' +
                        '<input required placeholder="0x0000000000000000000000000000000000000000" type="text" class="form-control required-multisig required-dapp">' +
                        '<span class="input-group-btn">' +
                            '<button class="btn btn-danger btn-remove" type="button"><i class="fa fa-fw fa-times"></i></button>' +
                        '</span>' +
                    '</div>'
                );
                $('#multisig-owners>div').fadeIn();
                return false;
            });
            $("#multisig-owners").on('click', '.btn-remove', function(){
                $(this).parents(".creation-form").fadeOut(function(){$(this).remove()});
            });
            $('#create-multisig-dapp').click(function(){
                var name = $('#dapp-name').val();
                var value = parseFloat($('#multisig-balance').val());
                var approvals = parseInt($("#multisig-approvals").val());
                var addresses = $('#multisig-owners input');
                var owners = [];
                addresses.each(function(){
                    let address = $(this).val();
                    if (address){
                        owners.push(address);
                    }
                });
                console.log(owners);
                that.create(approvals, owners, name, value);
            });
            
            if (network == "main") {
                window.multisigUndeployed = window.multisigMainUndeployed;
            } else if (network == "rinkeby") {
                window.multisigUndeployed = window.multisigRinkebyUndeployed;
            }
            
            if (!$.isEmptyObject(window.multisigUndeployed)) {
                setInterval(function(){
                    for (var key in window.multisigUndeployed) {
                        multisigDapp.checkDeployed(window.multisigUndeployed[key].address, window.multisigUndeployed[key].name, key);
                    }
                }, 3000);
            }
        },
        checkName: function(creator, name, callback){
            multisigContract.getWalletId(creator, name, function(e,d){
                if (d) {
                    if (d[1]) {
                        showNameError();
                    } else {
                        callback();
                    }
                }
            });
        },
        checkDeployed: function(address, name, id, redirect = false){
            multisigContract.getWalletId(address, name, function(e,d){
                if (d) {
                    if (d[1]) {
                        $.ajax({
                            url: '/builder/deploy_dapp.php',
                            type: 'POST',
                            dataType: 'json',
                            cache: false,
                            data: 'id=' + id,
                            error: function(jqXHR, error){},
                            success: function(data, status){
                                if (!data.error && data.success) {
                                    if (redirect) {
                                        if (network == "main") {
                                            location.href = '/builder/my-dapps.php';
                                        } else if (network == "rinkeby") {
                                            location.href = '/builder/my-dapps.php?network=rinkeby';
                                        }
                                    } else {
                                        delete window.multisigUndeployed[id];
                                        if (network == "main") {
                                            $("#my-dapps-li").fadeIn();
                                        } else if (network == "rinkeby") {
                                            $("#my-test-dapps-li").fadeIn();
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }
    }
})()

window.addEventListener('load', function(){
    multisigDapp.init();
});