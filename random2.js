async function getRequest(requestedProtocol, doctype, requestedMdocAttributes, transactionData = null, issuanceOffer = null, vct_values = null, encrypt_response = false, sign_request = false, dcql_query = null) {
    params = { protocol: requestedProtocol, doctype: doctype, attrs: requestedMdocAttributes }
    if (transactionData != null){
        params['transaction_data'] = transactionData
    }
    if (issuanceOffer != null){
        params['issuance_offer'] = issuanceOffer
    }
    if (vct_values != null) {
        params['vct_values'] = vct_values
    }
    if (dcql_query != null) {
        params['dcql_query'] = dcql_query
    }
    params['encrypt_response'] = encrypt_response
    params['sign_request'] = sign_request

    request = await callServer('getRequest', params)
    console.log("Server reply " + JSON.stringify(request))
    return request
}

async function getOpenID4VCICredenialOffer(grant_type, user, credentials, vp_request=null) {
    if (vp_request == null) {
        return await callServer('getOpenID4VCICredenialOffer', { grant_type: grant_type, user: user, credentials: credentials})
    } else {
        return await callServer('getOpenID4VCICredenialOffer', { grant_type: grant_type, user: user, credentials: credentials, vp_request: vp_request })
    }     
}

async function callServer(cmd, params) {
    const config = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
    }
    const response = await fetch('/api/' + cmd, config);
    return await response.json();
}

async function requestIssuance(requestedProtocol, doctype, requestedMdocAttributes) {
    var request = await getRequest(requestedProtocol, doctype, requestedMdocAttributes, null)

    try {
        const credentialResponse = await navigator.credentials.create({
            digital: {
                requests: [{
                    protocol: request['protocol'],
                    data: request['request']
                }]
            },
        })
        console.log("Response Data: " + credentialResponse.data)
        return "success"
    } catch (err) {
        alert(err)
    }
}

async function requestDigitalCreds(requestedProtocol, doctype, requestedMdocAttributes, transactionData = null, issuanceOffer = null, vct_values = null, encrypt_response = false, sign_request = false, dcql_query = null) {
    var request = await getRequest(requestedProtocol, doctype, requestedMdocAttributes, transactionData, issuanceOffer, vct_values, encrypt_response, sign_request, dcql_query)
    try {
        var credentialResponse  = await navigator.credentials.get({
                digital: {
                    requests: [{
                        protocol: request['protocol'],
                        data: request['request']
                    }]
                },
            })
        if (credentialResponse.constructor.name == 'DigitalCredential') {
            const data = credentialResponse.data
            const protocol = credentialResponse.protocol
            console.log("Response Data: " + data + " Protocol: " + protocol)
            const responseForServer = { protocol: protocol, data: data, state: request['state'], origin: location.origin }
            const serverResponse = await callServer('validateResponse', responseForServer)
            return serverResponse
        } else if (credentialResponse.constructor.name == 'IdentityCredential') {
            const data = credentialResponse.token
            const protocol = requestedProtocol
            console.log("Response Data: " + data + " Protocol: " + protocol)
            const responseForServer = { protocol: protocol, data: data, state: request['state'], origin: location.origin }
            const serverResponse = await callServer('validateResponse', responseForServer)
            return serverResponse
        } else {
            throw "Unknown response type"
        }

    } catch (err) {
        alert(err)
    }
}
