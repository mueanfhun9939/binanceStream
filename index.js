const api    = require('binance');
const Influx = require('influx');

const fs = require( 'fs' )

const envFlie = './env.json'

let setting = {
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET
}


if( fs.existsSync(envFlie) ){

    setting = require(envFlie)
    
}


async function connectDatabase() {

    const influx = new Influx.InfluxDB({
        host: 'ubuntu',
        database: 'CurrentPrices',
        port: 6868
    });

    await influx
    .getDatabaseNames()
    .then( names => {
        console.log( names )
        if ( !names.includes('CurrentPrices') ) {
        return influx.createDatabase('CurrentPrices')
        }
    })

    influx.query('select * from CurrentPrices').then(results => {
        console.log(results)
      })

    return influx
    
}


function connectBinanceStearm( influx ) {

    const binanceRest = new api.BinanceRest({
        key: setting.apiKey, // Get this from your account on binance.com
        secret: setting.apiSecret, // Same for this
        timeout: 30000, // Optional, defaults to 15000, is the request time out in milliseconds
        recvWindow: 5000, // Optional, defaults to 5000, increase if you're getting timestamp errors
        disableBeautification: false,
        /*
         * Optional, default is false. Binance's API returns objects with lots of one letter keys.  By
         * default those keys will be replaced with more descriptive, longer ones.
         */
        handleDrift: false
        /* Optional, default is false.  If turned on, the library will attempt to handle any drift of
         * your clock on it's own.  If a request fails due to drift, it'll attempt a fix by requesting
         * binance's server time, calculating the difference with your own clock, and then reattempting
         * the request.
         */
    });

    
    const binanceWS = new api.BinanceWS( true ); // Argument specifies whether the responses should be beautified, defaults to true
    const binanceSocketStream   = binanceWS.streams;

    const streamTickets = [
        binanceSocketStream.allTickers()
    ];

    function streamTicketEvent( streamEvent ) {
        switch( streamEvent.stream ) {
            case binanceSocketStream.allTickers():
                let symb = streamEvent.data;
                // var newarray = symb.map(getData)

                // function getData(item) {
                //     var fullList = [ item.openTime,item.symbol,item.open ].join(" ");                                          
                //         influx.writePoints([
                //             {
                //                 measurement: 'CurrentPrices',
                //                 tags: { symbolName: item.symbol },
                //                 fields: { openTime: item.openTime, CurrentPrices: item.open },
                //             }
                //         ]).then(() => {
                //             console.log('Added data to the CurrentPrices');
                //         }).catch((err) => {
                //             console.log(err);
                //         })
                // }
                break;
        }
    }

    binanceWS.onCombinedStream( streamTickets, streamTicketEvent);
}

async function  main(){

    try{
        const influx = await connectDatabase();
        const binanceStream = connectBinanceStearm(influx);
    }catch(err){
        console.log(err)
        setTimeout( () =>{
            main()
        },3000)
       
    }


}

main();