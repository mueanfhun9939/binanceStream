const Influx = require('influx');

const influx = new Influx.InfluxDB({
    host: 'localhost',
    database: 'ocean_tides',
    schema: [
      {
        measurement: 'tide',
        fields: { height: Influx.FieldType.FLOAT },
        tags: ['unit', 'location']
      }
    ]
  });

  const influx = new Influx.InfluxDB('http://user:password@host:8086/database')

  