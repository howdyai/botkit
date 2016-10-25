function SoapboxApi()
{
    this.send = function(message, callback)
    {
        console.log('Sending message to API:');
        console.log(message);

        callback();
    }
}

module.exports = SoapboxApi;
